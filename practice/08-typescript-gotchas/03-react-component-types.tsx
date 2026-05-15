/**
 * PRACTICE 03 — React component typing
 * Difficulty: Medium
 * Time target: 4 minutes
 *
 * Task: Fix the typing issues. Each function below has at least one problem.
 */

import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';

// Problem A: Component prop typing
export function Card(props: object) {
  return <div className="card">{props.children}</div>;
}

// Problem B: Children type
export function Section({ children }: { children: any }) {
  return <section>{children}</section>;
}

// Problem C: Event typing
export function Form() {
  function handleSubmit(e: any) {
    e.preventDefault();
  }
  return <form onSubmit={handleSubmit} />;
}

// Problem D: Generic component
export function List(props: { items: any; renderItem: (item: any) => any }) {
  return <ul>{props.items.map(props.renderItem)}</ul>;
}

// Problem E: Polymorphic-ish — "as" pattern poorly typed
export function Box(props: { as?: any; children: ReactNode }) {
  const Tag = props.as ?? 'div';
  return <Tag>{props.children}</Tag>;
}

/**
 * QUESTIONS:
 * 1. A: `object` doesn't have `children`. Use `PropsWithChildren` or `{ children: ReactNode }`.
 * 2. B: `any` defeats TS. Use `ReactNode`.
 * 3. C: Event has a specific type — `FormEvent<HTMLFormElement>`.
 * 4. D: Generic. Make `List<T>` parametric.
 * 5. E: Polymorphic component — type `as` properly. Often best to just take an explicit element type.
 *
 * Rewrite each with proper typing.
 *
 * STRETCH: type the Box component properly so `<Box as="a" href="..." />` typechecks but
 *          `<Box as="div" href="..." />` errors. This is the "polymorphic component" pattern.
 */
