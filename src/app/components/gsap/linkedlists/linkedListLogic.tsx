import { LinkedListNode, LinkedListOperation } from './types';

class ListNode {
  value: string;
  next: ListNode | null;
  id: string;

  constructor(value: string, next: ListNode | null = null) {
    this.value = value;
    this.next = next;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

export class LinkedList {
  private head: ListNode | null;
  private tail: ListNode | null;
  private size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  append(value: string): LinkedListNode[] {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.size++;
    return this.toArray();
  }

  prepend(value: string): LinkedListNode[] {
    const newNode = new ListNode(value, this.head);
    this.head = newNode;
    if (!this.tail) {
      this.tail = newNode;
    }
    this.size++;
    return this.toArray();
  }

  delete(value: string): LinkedListNode[] {
    if (!this.head) return this.toArray();
    
    if (this.head.value === value) {
      this.head = this.head.next;
      if (!this.head) {
        this.tail = null;
      }
      this.size--;
      return this.toArray();
    }
    
    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        current.next = current.next.next;
        if (!current.next) {
          this.tail = current;
        }
        this.size--;
        return this.toArray();
      }
      current = current.next;
    }
    
    return this.toArray();
  }

  insertAfter(targetValue: string, newValue: string): LinkedListNode[] {
    if (!this.head) return this.toArray();
    
    let current = this.head;
    while (current) {
      if (current.value === targetValue) {
        const newNode = new ListNode(newValue, current.next);
        current.next = newNode;
        if (current === this.tail) {
          this.tail = newNode;
        }
        this.size++;
        return this.toArray();
      }
      current = current.next!;
    }
    
    return this.toArray();
  }

  toArray(): LinkedListNode[] {
    const result: LinkedListNode[] = [];
    let current = this.head;
    while (current) {
      result.push({
        id: current.id,
        value: current.value,
        next: current.next ? current.next.id : null
      });
      current = current.next;
    }
    return result;
  }
}