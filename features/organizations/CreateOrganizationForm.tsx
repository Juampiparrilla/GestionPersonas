"use client";

import { useActionState } from "react";

import { DniField } from "@/components/fields/DniField";
import { NameField } from "@/components/fields/NameField";
import { PhoneField } from "@/components/fields/PhoneField";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field, FormError, FormFooter, useCreatedIntent } from "@/components/ui/FormParts";
import { inputClass, inputMonoClass } from "@/components/ui/styles";
import { useFormFields } from "@/components/ui/useFormFields";
import { validateDni, validateFullName, validatePhone } from "@/utils/validation";

import { createOrganizationAction, type CreateOrganizationState } from "./actions";

const initialState: CreateOrganizationState = { error: null, success: false };

type OrgFieldName = "orgName" | "adminFullName" | "adminDni" | "adminEmail" | "adminPhone";

const FIELD_ORDER: OrgFieldName[] = [
  "orgName",
  "adminFullName",
  "adminDni",
  "adminEmail",
  "adminPhone",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// El padre (CreateSheet) limpia este formulario pasandole un `key` que
// cambia en cada alta exitosa -- mismo patron que CreateLeaderForm.
export function CreateOrganizationForm({ onCreated }: { onCreated: (again: boolean) => void }) {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState);
  const setIntent = useCreatedIntent(state, onCreated);
  const f = useFormFields<OrgFieldName>({
    initial: { orgName: "", adminFullName: "", adminDni: "", adminEmail: "", adminPhone: "" },
    validators: {
      orgName: (value) => (value.trim() ? null : "Falta el nombre de la organización."),
      adminFullName: validateFullName,
      adminDni: validateDni,
      adminEmail: (value) =>
        !value.trim() || EMAIL_PATTERN.test(value.trim()) ? null : "El correo no es válido.",
      adminPhone: validatePhone,
    },
    serverErrors: undefined,
    order: FIELD_ORDER,
  });

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-[14px]">
      <FormError message={state.error} />

      <div className="flex flex-col gap-[14px] lg:grid lg:grid-cols-2 lg:gap-x-4">
      <Field id="orgName" label="Nombre de la organización" required wide error={f.error("orgName")}>
        <input
          id="orgName"
          name="orgName"
          required
          className={inputClass}
          value={f.values.orgName}
          onChange={(event) => f.setValue("orgName", event.target.value)}
          onBlur={() => f.blur("orgName")}
        />
      </Field>

      <div className="lg:col-span-2">
        <Eyebrow>Administrador de la organización</Eyebrow>
      </div>

      <Field id="adminFullName" label="Nombre completo" required wide error={f.error("adminFullName")}>
        <NameField
          id="adminFullName"
          name="adminFullName"
          required
          className={inputClass}
          value={f.values.adminFullName}
          onValueChange={(value) => f.setValue("adminFullName", value)}
          onBlur={() => f.blur("adminFullName")}
          invalid={Boolean(f.error("adminFullName"))}
        />
      </Field>

      <Field id="adminDni" label="DNI" required error={f.error("adminDni")}>
        <DniField
          id="adminDni"
          name="adminDni"
          required
          className={inputMonoClass}
          value={f.values.adminDni}
          onValueChange={(value) => f.setValue("adminDni", value)}
          onBlur={() => f.blur("adminDni")}
          invalid={Boolean(f.error("adminDni"))}
        />
      </Field>

      <Field id="adminEmail" label="Correo electrónico" wide error={f.error("adminEmail")}>
        <input
          id="adminEmail"
          name="adminEmail"
          type="email"
          className={inputClass}
          value={f.values.adminEmail}
          onChange={(event) => f.setValue("adminEmail", event.target.value)}
          onBlur={() => f.blur("adminEmail")}
        />
      </Field>

      <Field id="adminPhone" label="Teléfono" error={f.error("adminPhone")}>
        <PhoneField
          id="adminPhone"
          name="adminPhone"
          className={inputMonoClass}
          value={f.values.adminPhone}
          onValueChange={(value) => f.setValue("adminPhone", value)}
          onBlur={() => f.blur("adminPhone")}
          invalid={Boolean(f.error("adminPhone"))}
        />
      </Field>
      </div>

      <FormFooter
        pending={pending}
        pendingLabel="Creando…"
        disabled={!f.canSubmit}
        label="Crear organización"
        showAgain={false}
        onIntent={setIntent}
      />
    </form>
  );
}
