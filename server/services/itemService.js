const pool = require("../db");

// ------------------
// Create an item
// ------------------

const createItemService = async ({
  workspaceId,
  parentId = null,
  type,
  title,
  content,
  position = null,
  afterItemId = null,
  createdBy = null,
}) => {
  // Validate type
  if (!["page", "block"].includes(type)) {
    throw new Error("Invalid type");
  }

  // Only pages can exist at workspace root level
  if (parentId === null && type !== "page") {
    throw new Error("Only pages can exist at the root level");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify parent exists
    let parent = null;

    if (parentId) {
      const parentResult = await client.query(
        `
        SELECT id, type, workspace_id
        FROM items
        WHERE id = $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [parentId, workspaceId],
      );

      if (parentResult.rows.length === 0) {
        throw new Error("Parent not found");
      }

      parent = parentResult.rows[0];

      // A block cannot be the parent of a page
      if (type === "page" && parent.type === "block") {
        throw new Error(
          "Invalid nesting: A block cannot be the parent of a page",
        );
      }
    }

    // Normalize defaults & enforce type rules
    if (type === "page") {
      title = title?.trim() || "New Page";
      content = {}; // Force empty content for pages
    }

    if (type === "block") {
      title = null; // Force no title for blocks

      if (typeof content === "string") {
        content = { text: content };
      } else if (!content || typeof content !== "object") {
        content = { text: "" };
      }
    }

    // Final position
    let finalPosition;

    // Case 1: Insert after current item
    if (afterItemId) {
      const afterResult = await client.query(
        `
        SELECT id, position, parent_id
        FROM items
        WHERE id = $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [afterItemId, workspaceId],
      );

      if (afterResult.rows.length === 0) {
        throw new Error("After item not found");
      }

      const afterItem = afterResult.rows[0];

      // Ensure after item belongs to same parent
      if (afterItem.parent_id !== parentId) {
        throw new Error("Cannot insert after item in different parent");
      }

      const nextResult = await client.query(
        `
        SELECT position
        FROM items
        WHERE parent_id IS NOT DISTINCT FROM $1
          AND workspace_id = $2
          AND deleted_at IS NULL
          AND position > $3
        ORDER BY position ASC
        LIMIT 1
        `,
        [parentId, workspaceId, afterItem.position],
      );

      const nextItem = nextResult.rows[0];

      if (!nextItem) {
        // If next item doesn't exist, append to end
        finalPosition = afterItem.position + 1000;
      } else {
        // Otherwise, place between
        finalPosition = (afterItem.position + nextItem.position) / 2;
      }

      // Case 2: Default append to end
    } else {
      const maxResult = await client.query(
        `
        SELECT COALESCE(MAX(position), 0) AS max_position
        FROM items
        WHERE parent_id IS NOT DISTINCT FROM $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [parentId, workspaceId],
      );

      finalPosition = maxResult.rows[0].max_position + 1000;
    }

    // Insert into DB
    const result = await client.query(
      `
      INSERT INTO items (
        workspace_id,
        parent_id,
        type,
        title,
        content,
        position,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [workspaceId, parentId, type, title, content, finalPosition, createdBy],
    );

    const newItem = result.rows[0];

    // If creating a new page, automtically create an empty block inside it
    if (type === "page") {
      await client.query(
        `
        INSERT INTO items (
          workspace_id,
          parent_id,
          type,
          title,
          content,
          position,
          created_by
        )
        VALUES ($1, $2, 'block', NULL, $3, $4, $5)
       `,
        [workspaceId, newItem.id, { text: "" }, 1000, createdBy],
      );
    }

    await client.query("COMMIT");

    return newItem;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Get all items in a workspace (root level)
// ------------------

const getItemsInWorkspaceService = async ({ workspaceId }) => {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT id, type, title, content, parent_id, position
      FROM items
      WHERE workspace_id = $1
        AND parent_id IS NULL
        AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [workspaceId],
    );

    return result.rows;
  } finally {
    client.release();
  }
};

// ------------------
// Get all items in a parent container
// ------------------

const getItemInParentService = async ({ workspaceId, parentId }) => {
  const client = await pool.connect();

  try {
    // Verify parent exists
    const parentResult = await client.query(
      `
      SELECT id
      FROM items
      WHERE id = $1
        AND workspace_id = $2
        AND deleted_at IS NULL
      `,
      [parentId, workspaceId],
    );

    if (parentResult.rows.length === 0) {
      throw new Error("Parent not found");
    }

    // Fetch children
    const result = await client.query(
      `
      SELECT id,
            workspace_id,
            parent_id,
            type,
            title,
            content,
            position
      FROM items
      WHERE workspace_id = $1
        AND parent_id = $2
        AND deleted_at IS NULL
      ORDER BY position ASC
      `,
      [workspaceId, parentId],
    );

    return result.rows;
  } finally {
    client.release();
  }
};

// ------------------
// Update page title & block content
// ------------------

const updateItemService = async ({ workspaceId, itemId, title, content }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get item + type
    const result = await client.query(
      `
      SELECT id, type
      FROM items
      WHERE id = $1
        AND workspace_id = $2
        AND deleted_at IS NULL
      `,
      [itemId, workspaceId],
    );

    if (result.rows.length === 0) {
      throw new Error("Item not found");
    }

    const item = result.rows[0];

    const fields = [];
    const values = [];
    let idx = 1;

    // Pages can only have titles
    if (item.type === "page") {
      if (content !== undefined) {
        throw new Error("Pages cannot have content");
      }

      if (title !== undefined) {
        fields.push(`title = $${idx++}`);
        values.push(title);
      }
    }

    // Blocks can only have content
    if (item.type === "block") {
      if (title !== undefined) {
        throw new Error("Blocks cannot have a title");
      }

      if (content !== undefined) {
        if (typeof content !== "object" || content === null) {
          throw new Error("Block content must be an object");
        }

        fields.push(`content = $${idx++}`);
        values.push(content);
      }
    }

    // Nothing to update
    if (fields.length === 0) {
      return result.rows[0];
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE items
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(itemId);

    const updated = await client.query(query, values);

    await client.query("COMMIT");

    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Move an item
// ------------------

const moveItemService = async ({
  workspaceId,
  itemId,
  newParentId = null,
  newIndex,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const itemResult = await client.query(
      `
      SELECT id, type, parent_id
      FROM items
      WHERE id = $1
        AND workspace_id = $2
        AND deleted_at IS NULL
      FOR UPDATE
      `,
      [itemId, workspaceId],
    );

    if (itemResult.rows.length === 0) {
      throw new Error("Item not found");
    }

    const item = itemResult.rows[0];

    // Get new parent (if it exists)
    let parent = null;

    if (newParentId) {
      const parentResult = await client.query(
        `
        SELECT id, type
        FROM items
        WHERE id = $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [newParentId, workspaceId],
      );

      if (parentResult.rows.length === 0) {
        throw new Error("Parent not found");
      }

      parent = parentResult.rows[0];

      // A block cannot be the parent of a page
      if (item.type === "page" && parent.type === "block") {
        throw new Error(
          "Invalid nesting: A block cannot be the parent of a page",
        );
      }
    }

    // Prevent moving item into itself
    if (newParentId === itemId) {
      throw new Error("Cannot move item into itself");
    }

    // Prevent circular nesting
    if (newParentId) {
      const descendantCheck = await client.query(
        `
        WITH RECURSIVE subtree AS (
          SELECT id
          FROM items
          WHERE parent_id = $1

          UNION ALL

          SELECT i.id
          FROM items i
          INNER JOIN subtree s
            ON i.parent_id = s.id
        )
        
        SELECT id
        FROM subtree
        WHERE id = $2
        `,
        [itemId, newParentId],
      );

      if (descendantCheck.rows.length > 0) {
        throw new Error("Cannot move page into its own descendant");
      }
    }

    // Fetch all siblings under the new parent
    const siblingsResult = await client.query(
      `
      SELECT id, position
      FROM items
      WHERE parent_id IS NOT DISTINCT FROM $1
        AND workspace_id = $2
        AND deleted_at IS NULL
        AND id != $3
      ORDER BY position ASC
      FOR UPDATE
      `,
      [newParentId, workspaceId, itemId],
    );

    const siblings = siblingsResult.rows;

    // Compute new position using fractional indexing
    let newPosition;
    let indexClamped = newIndex;

    if (newIndex === undefined || newIndex >= siblings.length) {
      newPosition =
        siblings.length > 0
          ? siblings[siblings.length - 1].position + 1000
          : 1000;
    } else if (newIndex <= 0) {
      newPosition = siblings[0].position / 2;
    } else {
      const prev = siblings[newIndex - 1];
      const next = siblings[newIndex];
      newPosition = (prev.position + next.position) / 2;
    }

    // Normalize if positions are too close
    const MIN_GAP = 1;

    if (siblings.length > 1) {
      const before = siblings[indexClamped - 1];
      const after = siblings[indexClamped];

      if (before && after && after.position - before.position < MIN_GAP) {
        await client.query(
          `
          UPDATE items i
          SET position = ordered.new_position
          FROM (
            SELECT id,
                  ROW_NUMBER() OVER (ORDER BY position ASC) * 1000 AS new_position
            FROM items
            WHERE parent_id IS NOT DISTINCT FROM $1
              AND workspace_id = $2
              AND deleted_at IS NULL
          ) AS ordered
          WHERE i.id = ordered.id;
          `,
          [newParentId, workspaceId],
        );

        // Re-fetch siblings after normalization
        const refreshed = await client.query(
          `
          SELECT id, position
          FROM items
          WHERE parent_id IS NOT DISTINCT FROM $1
            AND workspace_id = $2
            AND deleted_at IS NULL
            AND id != $3
          ORDER BY position ASC
          `,
          [newParentId, workspaceId, itemId],
        );

        const refreshedSiblings = refreshed.rows;

        // If user tries to insert past the end, put at the end of the list
        if (indexClamped > refreshedSiblings.length) {
          indexClamped = refreshedSiblings.length;
        }

        const beforeR = refreshedSiblings[indexClamped - 1];
        const afterR = refreshedSiblings[indexClamped];

        if (!beforeR && !afterR) {
          newPosition = 1000;
        } else if (!beforeR) {
          newPosition = afterR.position / 2;
        } else if (!afterR) {
          newPosition = beforeR.position + 1000;
        } else {
          newPosition = (beforeR.position + afterR.position) / 2;
        }
      }
    }

    // Update the item
    const updateResult = await client.query(
      `
      UPDATE items
      SET parent_id = $1,
          position = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [newParentId, newPosition, itemId],
    );

    await client.query("COMMIT");

    return updateResult.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Soft delete an item
// ------------------

const softDeleteItemService = async ({ workspaceId, itemId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify item exists
    const itemResult = await client.query(
      `
      SELECT id
      FROM items
      WHERE id = $1
        AND workspace_id = $2
        AND deleted_at IS NULL
      `,
      [itemId, workspaceId],
    );

    if (itemResult.rows.length === 0) {
      throw new Error("Item not found");
    }

    // Build recursive tree for soft delete
    const deleteResult = await client.query(
      `
      WITH RECURSIVE item_tree AS (
        SELECT id
        FROM items
        WHERE id = $1
          AND workspace_id = $2

        UNION ALL

        SELECT i.id
        FROM items i
        INNER JOIN item_tree it
          ON i.parent_id = it.id
        WHERE i.workspace_id = $2
      )

      UPDATE items
      SET deleted_at = NOW()
      WHERE id IN (SELECT id FROM item_tree)
        AND workspace_id = $2
        AND deleted_at IS NULL
      RETURNING id
      `,
      [itemId, workspaceId],
    );

    await client.query("COMMIT");

    return {
      deletedIds: deleteResult.rows.map((r) => r.id),
      count: deleteResult.rowCount,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Restore a soft deleted item and all descendants (Within 30 day window)
// ------------------

const restoreItemService = async ({ workspaceId, itemId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify root item exists
    const rootResult = await client.query(
      `
      SELECT id, parent_id, deleted_at
      FROM items
      WHERE id = $1
        AND workspace_id = $2
      `,
      [itemId, workspaceId],
    );

    if (rootResult.rows.length === 0) {
      throw new Error("Item not found");
    }

    const rootItem = rootResult.rows[0];

    if (!rootItem.deleted_at) {
      throw new Error("Item is not deleted");
    }

    // Check restore window (30 days)
    const windowCheck = await client.query(
      `
      SELECT deleted_at > NOW() - INTERVAL '30 days' AS eligible
      FROM items
      WHERE id = $1
      `,
      [itemId],
    );

    if (!windowCheck.rows[0].eligible) {
      throw new Error("Restore window expired");
    }

    // Build recursive tree for restore
    const treeResult = await client.query(
      `
      WITH RECURSIVE item_tree AS (
        SELECT id, parent_id, deleted_at, 0 AS depth
        FROM items
        WHERE id = $1
          AND workspace_id = $2

        UNION ALL

        SELECT i.id, i.parent_id, i.deleted_at, it.depth + 1
        FROM items i
        INNER JOIN item_tree it
          ON i.parent_id = it.id
        WHERE i.workspace_id = $2
      )

      SELECT id, parent_id
      FROM item_tree
      WHERE deleted_at IS NOT NULL
        AND deleted_at > NOW() - INTERVAL '30 days'
      ORDER BY depth ASC
      `,
      [itemId, workspaceId],
    );

    const itemsToRestore = treeResult.rows;

    if (itemsToRestore.length === 0) {
      throw new Error("Restore window expired");
    }

    const restoredIds = [];

    // Restore each item one-by-one
    for (const item of itemsToRestore) {
      let maxPositionQuery;
      let values;

      // Get max position from current existing siblings
      if (item.parent_id === null) {
        // Root level item
        maxPositionQuery = `
          SELECT COALESCE(MAX(position), 0) AS max_position
          FROM items
          WHERE workspace_id = $1
            AND parent_id IS NULL
            AND deleted_at IS NULL
          FOR UPDATE
        `;
        values = [workspaceId];
      } else {
        // Child item
        maxPositionQuery = `
          SELECT COALESCE(MAX(position), 0) AS max_position
          FROM items
          WHERE workspace_id = $1
            AND parent_id = $2
            AND deleted_at IS NULL
          FOR UPDATE
        `;
        values = [workspaceId, item.parent_id];
      }

      const maxResult = await client.query(maxPositionQuery, values);

      const newPosition = maxResult.rows[0].max_position + 1000;

      const updateResult = await client.query(
        `
        UPDATE items
        SET deleted_at = NULL,
            position = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id
        `,
        [newPosition, item.id],
      );

      restoredIds.push(updateResult.rows[0].id);
    }

    await client.query("COMMIT");

    return {
      restoredIds,
      count: restoredIds.length,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createItemService,
  getItemsInWorkspaceService,
  getItemInParentService,
  updateItemService,
  moveItemService,
  softDeleteItemService,
  restoreItemService,
};
