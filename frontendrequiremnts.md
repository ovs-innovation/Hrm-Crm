# Frontend Engineering Requirements

## Overview

This project is built using React.js + Vite.

Every AI agent and developer MUST read this file before writing any frontend code.

The goal is to build a production-ready, scalable, responsive, fast, and maintainable frontend.

---

# Tech Stack

- React 19+
- Vite
- Tailwind CSS
- React Router DOM
- Redux Toolkit
- TanStack Query
- React Hook Form
- Zod
- Axios
- Framer Motion
- React Icons

---

# Architecture

Use Feature-Based Folder Structure.

Example

src/

app/

assets/

components/

features/

hooks/

layouts/

pages/

routes/

services/

store/

styles/

types/

utils/

constants/

Never put all files inside one folder.

---

# Component Rules

Each component should have a single responsibility.

Maximum component size should remain reasonable. If a component becomes too large, split it into smaller reusable components.

Create reusable components for

- Button
- Input
- Select
- Table
- Modal
- Drawer
- Card
- Avatar
- Badge
- Loader
- Pagination
- EmptyState
- ErrorState
- Skeleton

Never duplicate UI.

---

# Naming Rules

Bad

data

obj

temp

abc

Good

employeeList

attendanceRecord

monthlySalary

departmentOptions

Variable names should explain their purpose.

Components

PascalCase

EmployeeCard.jsx

AttendanceTable.jsx

Hooks

camelCase

useEmployee()

useAttendance()

---

# State Management

Use

Redux Toolkit

only for

- Authentication
- User
- Theme
- Global UI

Never store server data in Redux.

Use TanStack Query for

- API data
- Caching
- Refetching
- Pagination
- Infinite Query

Use local state whenever possible.

---

# Performance

Performance is mandatory.

Always use

React.lazy()

Suspense

Dynamic Import

Code Splitting

React.memo()

useMemo()

useCallback()

Image Lazy Loading

Intersection Observer

Pagination

Virtualization

Debounce Search

Throttle Scroll

Skeleton Loading

WebP / AVIF Images

Avoid unnecessary re-renders.

Do not create inline functions inside JSX when avoidable.

Do not pass unnecessary props.

---

# Routing

Use React Router.

Implement

Protected Routes

Public Routes

Role-Based Routes

404 Page

Unauthorized Page

Lazy load every page.

---

# Forms

Use

React Hook Form

Zod

Reusable Form Components

Show field-level validation.

Never use uncontrolled forms.

---

# API

Use Axios.

Create one centralized Axios instance.

Implement

JWT Interceptor

Refresh Token

Global Error Handling

Request Cancellation

Retry Logic where appropriate.

Never call APIs directly inside UI components.

Use service files.

---

# UI

Responsive

Desktop

Laptop

Tablet

Mobile

Dark Mode

Accessible

Loading States

Empty States

Error States

Smooth Animation

Never use browser alert().

Use Toast Notifications.

---

# Styling

Use Tailwind CSS.

Avoid inline styles.

Use reusable utility classes.

Keep design consistent.

---

# Tables

Reusable Table Component

Sorting

Filtering

Searching

Pagination

Bulk Selection

CSV Export

Excel Export

---

# Code Quality

Prefer const.

Avoid let where unnecessary.

Never use var.

Avoid nested ternary operators.

Extract repeated logic.

No magic numbers.

Use constants.

---

# Imports

Order

React

Third Party

Components

Hooks

Utils

Styles

---

# AI Agent Rules

Never generate placeholder code.

Never duplicate components.

Never skip loading states.

Never skip validation.

Always create reusable components.

Always optimize rendering.

Always lazy-load pages.

Always think about performance.

Always think about maintainability.

Always follow React best practices.