import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { LinkedListOperation } from './types';

export const codeTheme = tomorrow;

export const operationCodes: Record<LinkedListOperation, string> = {
  append: `function append(value: string) {
  const newNode = new Node(value);
  if (!this.head) {
    this.head = newNode;
    this.tail = newNode;
  } else {
    this.tail.next = newNode;
    this.tail = newNode;
  }
}`,

  prepend: `function prepend(value: string) {
  const newNode = new Node(value, this.head);
  this.head = newNode;
  if (!this.tail) {
    this.tail = newNode;
  }
}`,

  delete: `function delete(value: string) {
  if (!this.head) return;
  
  if (this.head.value === value) {
    this.head = this.head.next;
    if (!this.head) {
      this.tail = null;
    }
    return;
  }
  
  let current = this.head;
  while (current.next) {
    if (current.next.value === value) {
      current.next = current.next.next;
      if (!current.next) {
        this.tail = current;
      }
      return;
    }
    current = current.next;
  }
}`,

  insertAfter: `function insertAfter(targetValue: string, newValue: string) {
  if (!this.head) return;
  
  let current = this.head;
  while (current) {
    if (current.value === targetValue) {
      const newNode = new Node(newValue, current.next);
      current.next = newNode;
      if (current === this.tail) {
        this.tail = newNode;
      }
      return;
    }
    current = current.next;
  }
}`
};