import { describe, it, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import SubmitForm from "../../../src/routes/form/submit-form";
import { Form } from "../../../src/types/form";
import { supabaseService } from "../../../src/services/supabase";

vi.mock("@/services/supabase", () => ({
  supabaseService: {
    getFormById: vi.fn(),
    submitFormResponse: vi.fn(),
    getFormResponses: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
const mockParams = { id: "1" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams, // Mock useParams to return the ID
  };
});

const mockForm: Form = {
  id: 1,
  title: "Trigger Form",
  description: "Form for triggering workflow",
  schema: {
    fields: [
      {
        id: "field_1",
        type: "text",
        label: "Test Field",
        required: true,
        placeholder: "Enter text",
      },
    ],
  },
  created_at: "2026-02-20T10:00:00.000Z",
  updated_at: "2026-02-20T10:00:00.000Z",
  nodeId: "trigger-node-1",
};

const renderSubmitForm = (params: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams(params).toString();
  const fullPath = searchParams ? `/?${searchParams}` : "/";

  return render(
    <MemoryRouter initialEntries={[fullPath]}>
      <SubmitForm />
    </MemoryRouter>,
  );
};

const findSubmitButton = async () => {
  return await screen.findByRole("button", { name: /ارسال پاسخ/i });
};

const clickOnSubmitButton = async () => {
  const trigger = await findSubmitButton();
  await act(async () => {
    await userEvent.click(trigger);
  });
};

describe("Render Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.id = "1";
    (supabaseService.getFormById as any).mockResolvedValue(mockForm);
    (supabaseService.submitFormResponse as any).mockResolvedValue({ id: 1 });
    (supabaseService.getFormResponses as any).mockResolvedValue([]);
  });

  it("should redirect to address defined in the redirect query parameter", async () => {
    // act
    renderSubmitForm({ redirect: "/tasks" });
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText(mockForm.title)).toBeInTheDocument();
    });
    // Fill in the required field
    const inputField = screen.getByLabelText(/Test Field/i);
    await act(async () => {
      await userEvent.type(inputField, "Test value");
    });
    await clickOnSubmitButton();

    // assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/tasks");
    });
  });
});
