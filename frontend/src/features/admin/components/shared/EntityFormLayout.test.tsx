/**
 * Unit tests for EntityFormLayout component
 *
 * Tests layout structure: breadcrumbs, skeleton loading, saving state, error display
 * _Requirements: 12.1_
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import EntityFormLayout from "./EntityFormLayout";
import type { BreadcrumbItem } from "./EntityFormLayout";

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultProps = {
  title: "Create Unit",
  breadcrumbs: [
    { label: "Admin", href: "/admin" },
    { label: "Units", href: "/admin/units" },
    { label: "Create" },
  ] as BreadcrumbItem[],
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EntityFormLayout", () => {
  describe("Breadcrumbs", () => {
    it("renders all breadcrumb items", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Units")).toBeInTheDocument();
      expect(screen.getByText("Create")).toBeInTheDocument();
    });

    it("renders breadcrumb items with href as links", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const adminLink = screen.getByText("Admin");
      expect(adminLink.tagName).toBe("A");
      expect(adminLink).toHaveAttribute("href", "/admin");

      const unitsLink = screen.getByText("Units");
      expect(unitsLink.tagName).toBe("A");
      expect(unitsLink).toHaveAttribute("href", "/admin/units");
    });

    it("renders the last breadcrumb item without a link", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const lastCrumb = screen.getByText("Create");
      // Should be rendered as a Typography (P or SPAN), not an anchor
      expect(lastCrumb.tagName).not.toBe("A");
    });
  });

  describe("Page Title", () => {
    it("renders the title", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.getByText("Create Unit")).toBeInTheDocument();
    });

    it("renders a custom title", () => {
      render(
        <EntityFormLayout {...defaultProps} title="Edit Chapter">
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.getByText("Edit Chapter")).toBeInTheDocument();
    });
  });

  describe("Loading (skeleton) state", () => {
    it("shows skeleton when loading is true", () => {
      const { container } = render(
        <EntityFormLayout {...defaultProps} loading={true}>
          <div data-testid="main-content">Form content</div>
        </EntityFormLayout>
      );

      // Skeleton elements should be present (MUI Skeleton uses role="progressbar" or specific class)
      const skeletons = container.querySelectorAll(".MuiSkeleton-root");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not render children when loading", () => {
      render(
        <EntityFormLayout {...defaultProps} loading={true}>
          <div data-testid="main-content">Form content</div>
        </EntityFormLayout>
      );

      expect(screen.queryByTestId("main-content")).not.toBeInTheDocument();
    });

    it("renders children when not loading", () => {
      render(
        <EntityFormLayout {...defaultProps} loading={false}>
          <div data-testid="main-content">Form content</div>
        </EntityFormLayout>
      );

      expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });

    it("disables Save button when loading", () => {
      render(
        <EntityFormLayout {...defaultProps} loading={true}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Saving state", () => {
    it("disables Save button when saving", () => {
      render(
        <EntityFormLayout {...defaultProps} saving={true}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const saveButton = screen.getByRole("button", { name: /saving/i });
      expect(saveButton).toBeDisabled();
    });

    it("disables Cancel button when saving", () => {
      render(
        <EntityFormLayout {...defaultProps} saving={true}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it("shows 'Saving…' text on Save button when saving", () => {
      render(
        <EntityFormLayout {...defaultProps} saving={true}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.getByText("Saving…")).toBeInTheDocument();
    });

    it("shows a loading spinner in Save button when saving", () => {
      const { container } = render(
        <EntityFormLayout {...defaultProps} saving={true}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const spinner = container.querySelector(".MuiCircularProgress-root");
      expect(spinner).toBeInTheDocument();
    });

    it("shows 'Save' text when not saving", () => {
      render(
        <EntityFormLayout {...defaultProps} saving={false}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    });
  });

  describe("Server error display", () => {
    it("displays server error in an alert when present", () => {
      render(
        <EntityFormLayout
          {...defaultProps}
          serverError="Duplicate order_index value"
        >
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("Duplicate order_index value")
      ).toBeInTheDocument();
    });

    it("does not display an alert when serverError is null", () => {
      render(
        <EntityFormLayout {...defaultProps} serverError={null}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("does not display an alert when serverError is undefined", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Layout structure", () => {
    it("renders main content", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div data-testid="form-fields">Fields go here</div>
        </EntityFormLayout>
      );

      expect(screen.getByTestId("form-fields")).toBeInTheDocument();
    });

    it("renders sidebar when provided", () => {
      render(
        <EntityFormLayout
          {...defaultProps}
          sidebar={<div data-testid="sidebar-content">Sidebar</div>}
        >
          <div>Main content</div>
        </EntityFormLayout>
      );

      expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
    });

    it("does not render sidebar section when not provided", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div>Main content</div>
        </EntityFormLayout>
      );

      expect(
        screen.queryByTestId("sidebar-content")
      ).not.toBeInTheDocument();
    });

    it("renders junction section when provided", () => {
      render(
        <EntityFormLayout
          {...defaultProps}
          junctionSection={
            <div data-testid="junction-content">Junction Editor</div>
          }
        >
          <div>Main content</div>
        </EntityFormLayout>
      );

      expect(screen.getByTestId("junction-content")).toBeInTheDocument();
    });

    it("does not render junction section when not provided", () => {
      render(
        <EntityFormLayout {...defaultProps}>
          <div>Main content</div>
        </EntityFormLayout>
      );

      expect(
        screen.queryByTestId("junction-content")
      ).not.toBeInTheDocument();
    });
  });

  describe("Action buttons", () => {
    it("calls onSave when Save button is clicked", async () => {
      const onSave = vi.fn();
      render(
        <EntityFormLayout {...defaultProps} onSave={onSave}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const saveButton = screen.getByRole("button", { name: "Save" });
      await userEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when Cancel button is clicked", async () => {
      const onCancel = vi.fn();
      render(
        <EntityFormLayout {...defaultProps} onCancel={onCancel}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await userEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("does not call onSave when saving is true (button is disabled)", () => {
      const onSave = vi.fn();
      render(
        <EntityFormLayout {...defaultProps} onSave={onSave} saving={true}>
          <div>Form content</div>
        </EntityFormLayout>
      );

      const saveButton = screen.getByRole("button", { name: /saving/i });
      expect(saveButton).toBeDisabled();
      // A disabled MUI button has pointer-events: none, preventing clicks
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
