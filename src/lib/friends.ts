import type { Collection } from '@/lib/collections';

export interface Friend {
  /** Profile id, when the person comes from the database. */
  id?: string;
  name: string;
  /** Includes the leading @ */
  tag: string;
  initial: string;
  color: string;
  /** Public collections you can browse. */
  collections: Collection[];
}
