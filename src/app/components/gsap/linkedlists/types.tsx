export interface LinkedListNode {
  id: string;
  value: string;
  next: string | null;
}

export type LinkedListOperation = 'append' | 'prepend' | 'delete' | 'insertAfter';