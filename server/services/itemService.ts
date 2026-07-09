import pool from "../db.js";

// ------------------
// General Types
// ------------------

type ItemType = "page" | "block";

type ItemContent = Record<string, unknown>;

type Item = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  type: ItemType;
  title: string | null;
  content: ItemContent;
  position: number;
  created_by: string | null;
  updated_by: string | null;
  trashed_by_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

// ------------------
// Parameter Types
// ------------------

type CreateItemParams = {
  workspaceId: string;
  parentId?: string | null;
  type: ItemType;
  title?: string | null;
  content?: ItemContent | string;
  afterItemId?: string | null;
  createdBy?: string | null;
};

type GetItemsInWorkspaceParams = {
  workspaceId: string;
};

type GetItemInParentParams = {
  workspaceId: string;
  parentId: string;
};

type UpdateItemParams = {
  workspaceId: string;
  itemId: string;
  title?: string | null;
  content?: ItemContent;
};

type MoveItemParams = {
  workspaceId: string;
  itemId: string;
  newParentId?: string | null;
  newIndex?: number;
};

type SoftDeleteItemParams = {
  workspaceId: string;
  itemId: string;
  userId: string;
};

type GetTrashItemsParams = {
  workspaceId: string;
  userId: string;
};

type RestoreItemParams = {
  workspaceId: string;
  itemId: string;
};

type PermanentlyDeleteItemParams = {
  workspaceId: string;
  itemId: string;
};

type EmptyTrashParams = {
  workspaceId: string;
  userId: string;
};

// ------------------
// Function Return Types
// ------------------

type GetItemsInWorkspaceReturn = Pick<
  Item,
  "id" | "type" | "title" | "content" | "parent_id" | "position"
>[];

type GetItemInParentReturn = Pick<
  Item,
  | "id"
  | "workspace_id"
  | "parent_id"
  | "type"
  | "title"
  | "content"
  | "position"
>[];

type SoftDeleteItemReturn = {
  deletedIds: string[];
  count: number;
};

type GetTrashItemsReturn = Pick<
  Item,
  "id" | "parent_id" | "title" | "deleted_at" | "created_at" | "trashed_by_id"
>[];

type RestoreItemReturn = {
  restoredIds: string[];
  count: number;
};

type PermanentlyDeleteItemsReturn = {
  deletedIds: string[];
  count: number;
};

// ------------------
// Query Result Types
// ------------------

type ParentRow = Pick<Item, "id" | "type" | "workspace_id">;

type AfterItemRow = Pick<Item, "id" | "position" | "parent_id">;

type PositionRow = Pick<Item, "position">;

type MaxPositionRow = {
  max_position: number;
};

type ItemIdRow = Pick<Item, "id">;

type ItemTypeRow = Pick<Item, "id" | "type">;

type ItemMoveRow = Pick<Item, "id" | "type" | "parent_id">;

type ParentTypeRow = Pick<Item, "id" | "type">;

type SiblingRow = Pick<Item, "id" | "position">;

type RootItemRow = Pick<Item, "id" | "parent_id" | "deleted_at">;

type RestoreEligibilityRow = {
  eligible: boolean;
};

type RestoreTreeRow = Pick<Item, "id" | "parent_id">;

// ------------------
// Create an item
// ------------------

const createItemService = async ({
  workspaceId,
  parentId = null,
  type,
  title,
  content,
  afterItemId = null,
  createdBy = null,
}: CreateItemParams): Promise<Item> => {
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
    let parent: ParentRow | null = null;

    if (parentId) {
      const parentResult = await client.query<ParentRow>(
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

      parent = parentResult.rows[0]!;

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
    let finalPosition: number;

    // Case 1: Insert after current item
    if (afterItemId) {
      const afterResult = await client.query<AfterItemRow>(
        `
        SELECT id, position, parent_id
        FROM items
        WHERE id = $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [afterItemId, workspaceId],
      );

      const afterItem = afterResult.rows[0];

      if (!afterItem) {
        throw new Error("After item not found");
      }

      // Ensure after item belongs to same parent
      if (afterItem.parent_id !== parentId) {
        throw new Error("Cannot insert after item in different parent");
      }

      const nextResult = await client.query<PositionRow>(
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
      const maxResult = await client.query<MaxPositionRow>(
        `
        SELECT COALESCE(MAX(position), 0) AS max_position
        FROM items
        WHERE parent_id IS NOT DISTINCT FROM $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [parentId, workspaceId],
      );

      const maxPositionRow = maxResult.rows[0];

      if (!maxPositionRow) {
        throw new Error("Failed to calculate max position");
      }

      finalPosition = maxPositionRow.max_position + 1000;
    }

    // Insert into DB
    const result = await client.query<Item>(
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

    if (!newItem) {
      throw new Error("Failed to create item");
    }

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
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Get all items in a workspace (root level)
// ------------------

const getItemsInWorkspaceService = async ({
  workspaceId,
}: GetItemsInWorkspaceParams): Promise<GetItemsInWorkspaceReturn> => {
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

const getItemInParentService = async ({
  workspaceId,
  parentId,
}: GetItemInParentParams): Promise<GetItemInParentReturn> => {
  const client = await pool.connect();

  try {
    // Verify parent exists
    const parentResult = await client.query<ItemIdRow>(
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

const updateItemService = async ({
  workspaceId,
  itemId,
  title,
  content,
}: UpdateItemParams): Promise<Item> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get item + type
    const result = await client.query<ItemTypeRow>(
      `
      SELECT id, type
      FROM items
      WHERE id = $1
        AND workspace_id = $2
        AND deleted_at IS NULL
      `,
      [itemId, workspaceId],
    );

    const item = result.rows[0];

    if (!item) {
      throw new Error("Item not found");
    }

    const fields: string[] = [];
    const values: unknown[] = [];
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
      const existingResult = await client.query<Item>(
        `
        SELECT *
        FROM items
        WHERE id = $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [itemId, workspaceId],
      );

      const existingItem = existingResult.rows[0];

      if (!existingItem) {
        throw new Error("Item not found");
      }

      await client.query("COMMIT");

      return existingItem;
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE items
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;

    values.push(itemId);

    const updated = await client.query<Item>(query, values);

    const updatedItem = updated.rows[0];

    if (!updatedItem) {
      throw new Error("Failed to update item");
    }

    await client.query("COMMIT");

    return updatedItem;
  } catch (err: unknown) {
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
}: MoveItemParams): Promise<Item> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const itemResult = await client.query<ItemMoveRow>(
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

    const item = itemResult.rows[0];

    if (!item) {
      throw new Error("Item not found");
    }

    // Get new parent (if it exists)
    if (newParentId !== null) {
      const parentResult = await client.query<ParentTypeRow>(
        `
        SELECT id, type
        FROM items
        WHERE id = $1
          AND workspace_id = $2
          AND deleted_at IS NULL
        `,
        [newParentId, workspaceId],
      );

      const parent = parentResult.rows[0];

      if (!parent) {
        throw new Error("Parent not found");
      }

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
    const siblingsResult = await client.query<SiblingRow>(
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
    let newPosition: number;
    let indexClamped = newIndex ?? siblings.length;

    if (newIndex === undefined || newIndex >= siblings.length) {
      const lastSibling = siblings[siblings.length - 1];

      newPosition = lastSibling ? lastSibling.position + 1000 : 1000;
    } else if (newIndex <= 0) {
      const firstSibling = siblings[0];

      if (!firstSibling) {
        throw new Error("Cannot calculate position without siblings");
      }

      newPosition = firstSibling.position / 2;
    } else {
      const prev = siblings[newIndex - 1];
      const next = siblings[newIndex];

      if (!prev || !next) {
        throw new Error("Invalid index");
      }

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
        const refreshed = await client.query<SiblingRow>(
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
        } else if (!beforeR && afterR) {
          newPosition = afterR.position / 2;
        } else if (beforeR && !afterR) {
          newPosition = beforeR.position + 1000;
        } else if (beforeR && afterR) {
          newPosition = (beforeR.position + afterR.position) / 2;
        } else {
          throw new Error("Unexpected sibling state");
        }
      }
    }

    // Update the item
    const updateResult = await client.query<Item>(
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

    const updatedItem = updateResult.rows[0];

    if (!updatedItem) {
      throw new Error("Failed to move item");
    }

    await client.query("COMMIT");

    return updatedItem;
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Soft delete an item
// ------------------

const softDeleteItemService = async ({
  workspaceId,
  itemId,
  userId,
}: SoftDeleteItemParams): Promise<SoftDeleteItemReturn> => {
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
    const deleteResult = await client.query<ItemIdRow>(
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
      SET deleted_at = NOW(),
          trashed_by_id = CASE
            WHEN id = $1 THEN $3::uuid
            ELSE NULL
          END
      WHERE id IN (SELECT id FROM item_tree)
        AND workspace_id = $2
        AND deleted_at IS NULL
      RETURNING id
      `,
      [itemId, workspaceId, userId],
    );

    await client.query("COMMIT");

    return {
      deletedIds: deleteResult.rows.map((r) => r.id),
      count: deleteResult.rowCount ?? 0,
    };
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Get trash items (pages only)
// ------------------

const getTrashItemsService = async ({
  workspaceId,
  userId,
}: GetTrashItemsParams): Promise<GetTrashItemsReturn> => {
  const result = await pool.query(
    `
    SELECT id,
          parent_id,
          title,
          deleted_at,
          created_at,
          trashed_by_id
    FROM items
    WHERE workspace_id = $1
      AND type = 'page'
      AND deleted_at IS NOT NULL
      AND trashed_by_id = $2
    ORDER BY deleted_at DESC
    `,
    [workspaceId, userId],
  );

  return result.rows;
};

// ------------------
// Restore a soft deleted item and all descendants (Within 30 day window)
// ------------------

const restoreItemService = async ({
  workspaceId,
  itemId,
}: RestoreItemParams): Promise<RestoreItemReturn> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify root item exists
    const rootResult = await client.query<RootItemRow>(
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

    if (!rootItem) {
      throw new Error("Item not found");
    }

    if (!rootItem.deleted_at) {
      throw new Error("Item is not deleted");
    }

    // Check restore window (30 days)
    const windowCheck = await client.query<RestoreEligibilityRow>(
      `
      SELECT deleted_at > NOW() - INTERVAL '30 days' AS eligible
      FROM items
      WHERE id = $1
      `,
      [itemId],
    );

    const eligibility = windowCheck.rows[0];

    if (!eligibility) {
      throw new Error("Failed to determine restore eligibility");
    }

    if (!eligibility.eligible) {
      throw new Error("Restore window expired");
    }

    // Build recursive tree for restore
    const treeResult = await client.query<RestoreTreeRow>(
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

    const restoredIds: string[] = [];

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
        `;
        values = [workspaceId, item.parent_id];
      }

      const maxResult = await client.query<MaxPositionRow>(
        maxPositionQuery,
        values,
      );

      const maxPositionRow = maxResult.rows[0];

      if (!maxPositionRow) {
        throw new Error("Failed to calculate max position");
      }

      const newPosition = maxPositionRow.max_position + 1000;

      const updateResult = await client.query<ItemIdRow>(
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

      const updatedItem = updateResult.rows[0];

      if (!updatedItem) {
        throw new Error("Failed to restore item");
      }

      restoredIds.push(updatedItem.id);
    }

    await client.query("COMMIT");

    return {
      restoredIds,
      count: restoredIds.length,
    };
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Permanently delete an item and all descendants
// ------------------

const permanentlyDeleteItemService = async ({
  workspaceId,
  itemId,
}: PermanentlyDeleteItemParams): Promise<PermanentlyDeleteItemsReturn> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify item exists and is in trash
    const itemResult = await client.query(
      `
      SELECT id
      FROM items
      WHERE id = $1
        AND workspace_id = $2
        AND deleted_at IS NOT NULL
      `,
      [itemId, workspaceId],
    );

    if (itemResult.rows.length === 0) {
      throw new Error("Deleted item not found");
    }

    // Build recursive tree for permanently deleting an item
    const deleteResult = await client.query<ItemIdRow>(
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

      DELETE FROM items
      WHERE id IN (SELECT id FROM item_tree)
      RETURNING id
      `,
      [itemId, workspaceId],
    );

    await client.query("COMMIT");

    return {
      deletedIds: deleteResult.rows.map((r) => r.id),
      count: deleteResult.rowCount ?? 0,
    };
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ------------------
// Permanently delete all trash items
// ------------------

const emptyTrashService = async ({
  workspaceId,
  userId,
}: EmptyTrashParams): Promise<PermanentlyDeleteItemsReturn> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const deleteResult = await client.query<ItemIdRow>(
      `
      DELETE FROM items
      WHERE workspace_id = $1
        AND type = 'page'
        AND deleted_at IS NOT NULL
        AND trashed_by_id = $2
      RETURNING id
      `,
      [workspaceId, userId],
    );

    await client.query("COMMIT");

    return {
      deletedIds: deleteResult.rows.map((r) => r.id),
      count: deleteResult.rowCount ?? 0,
    };
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export {
  createItemService,
  getItemsInWorkspaceService,
  getItemInParentService,
  updateItemService,
  moveItemService,
  softDeleteItemService,
  getTrashItemsService,
  restoreItemService,
  permanentlyDeleteItemService,
  emptyTrashService,
};
