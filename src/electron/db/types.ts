// Row types for the SQLite tables. Hand-written (no ORM); keep these in sync
// with the DDL in ./migrations.ts. Field names match the snake_case columns.

export type KnowledgeNodeType = "category" | "technology" | "concept";

export type KnowledgeStatus =
  | "learned"
  | "learning"
  | "comfortable"
  | "mastered"
  | "discovered"
  | "needs_review";

export type RelationshipType = "parent_of" | "related_to" | "prerequisite_for";

export interface KnowledgeNode {
  id: number;
  type: KnowledgeNodeType;
  name: string;
  slug: string;
  description: string | null;
  status: KnowledgeStatus;
  importance: number;
  created_at: string;
  updated_at: string;
}

export interface NewKnowledgeNode {
  type: KnowledgeNodeType;
  name: string;
  slug: string;
  description?: string | null;
  status?: KnowledgeStatus;
  importance?: number;
}

export interface KnowledgeRelationship {
  id: number;
  source_node_id: number;
  target_node_id: number;
  relationship_type: RelationshipType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewKnowledgeRelationship {
  source_node_id: number;
  target_node_id: number;
  relationship_type: RelationshipType;
  notes?: string | null;
}
