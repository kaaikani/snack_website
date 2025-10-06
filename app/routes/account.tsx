
"use client"

import { DialogFooter } from "~/components/ui/dialog"
import type React from "react"
import { Outlet, useLoaderData, useSearchParams, useLocation, useActionData, useNavigation } from "@remix-run/react"
import { type LoaderFunctionArgs, json, redirect, type DataFunctionArgs } from "@remix-run/server-runtime"
import { getActiveCustomerDetails } from "~/providers/customer/customer"
import { useTranslation } from "react-i18next"
import { useEffect, useState, useRef } from "react"
import { getSessionStorage } from "~/sessions"
import { withZod } from "@remix-validated-form/with-zod"
import { ValidatedForm, validationError } from "remix-validated-form"
import { z } from "zod"
import { requestUpdateCustomerEmailAddress, updateCustomer } from "~/providers/account/account"
import useToggleState from "~/utils/use-toggle-state"
import { replaceEmptyString } from "~/utils/validation"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { User, Edit, Mail, Check, Phone } from "lucide-react"
import { HighlightedButton } from "~/components/HighlightedButton"
import AccountHeader from "~/components/account/AccountHeader"

export enum FormIntent {
  UpdateEmail = "updateEmail",
  UpdateDetails = "updateDetails",
  UpdatePhone = "updatePhone",
}

export const validator = withZod(
  z.object({
    title: z.string(),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    phoneNumber: z.string().optional(),
  }),
)

const changeEmailValidator = withZod(
  z.object({
    email: z.string().min(1, { message: "Email is required" }).email("Must be a valid email"),
    password: z.string().min(1, { message: "Password is required" }),
  }),
)

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { activeCustomer } = await getActiveCustomerDetails({ request })

    if (!activeCustomer) {
      const sessionStorage = await getSessionStorage()
      const session = await sessionStorage.getSession(request.headers.get("Cookie"))

      session.unset("authToken")
      session.unset("channelToken")

      return redirect("/sign-in", {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      })
    }

    return json({ activeCustomer })
  } catch (error) {
    console.error("Loader error:", error)
    throw new Response("Internal Server Error", { status: 500 })
  }
}

function isFormError(err: unknown): err is FormError {
  return (err as FormError).message !== undefined
}

function isEmailSavedResponse(response: unknown): response is EmailSavedResponse {
  return (response as EmailSavedResponse).newEmailAddress !== undefined
}

function isCustomerUpdatedResponse(response: unknown): response is CustomerUpdatedResponse {
  return (response as CustomerUpdatedResponse).customerUpdated !== undefined
}

export type FormError = {
  message: string
  intent?: string
}

type EmailSavedResponse = {
  newEmailAddress: string
}

type CustomerUpdatedResponse = {
  customerUpdated: true
}

export async function action({ request }: DataFunctionArgs) {
  const body = await request.formData()
  const intent = body.get("intent") as FormIntent | null

  const formError = (formError: FormError, init?: number | ResponseInit) => {
    return json<FormError>(formError, init)
  }

  if (intent === FormIntent.UpdateEmail) {
    const result = await changeEmailValidator.validate(body)

    if (result.error) {
      return validationError(result.error)
    }

    const { email, password } = result.data

    const updateResult = await requestUpdateCustomerEmailAddress(password, email, { request })

    if (updateResult.__typename !== "Success") {
      return formError(
        { message: updateResult.message || "Failed to update email", intent: FormIntent.UpdateEmail },
        { status: 401 },
      )
    }

    return json<EmailSavedResponse>({ newEmailAddress: email }, { status: 200 })
  }

  if (intent === FormIntent.UpdateDetails) {
    const result = await validator.validate(body)

    if (result.error) {
      return validationError(result.error)
    }

    const { title, firstName, lastName, phoneNumber } = result.data

    try {
      await updateCustomer({ title, firstName, lastName, phoneNumber }, { request })
      return json<CustomerUpdatedResponse>({ customerUpdated: true }, { status: 200 })
    } catch (error: any) {
      return formError(
        { message: error.message || "Failed to update customer details", intent: FormIntent.UpdateDetails },
        { status: 400 },
      )
    }
  }

  if (intent === FormIntent.UpdatePhone) {
    const phoneNumberValidator = withZod(
      z.object({
        phoneNumber: z
          .string()
          .min(1, { message: "Phone number is required" })
          .regex(/^\+?[1-9]\d{1,14}$/, { message: "Invalid phone number format" }),
      }),
    )

    const result = await phoneNumberValidator.validate(body)

    if (result.error) {
      return validationError(result.error)
    }

    const { phoneNumber } = result.data

    try {
      await updateCustomer({ phoneNumber }, { request })
      return json<CustomerUpdatedResponse>({ customerUpdated: true }, { status: 200 })
    } catch (error: any) {
      return formError(
        { message: error.message || "Failed to update phone number", intent: FormIntent.UpdatePhone },
        { status: 400 },
      )
    }
  }

  return formError({ message: "No valid form intent" }, { status: 401 })
}

export default function AccountDashboard() {
  const { activeCustomer } = useLoaderData<typeof loader>()
  const { firstName, lastName, emailAddress, phoneNumber, title } = activeCustomer!
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const actionDataHook = useActionData<typeof action>()
  const { state } = useNavigation()

  const [formError, setFormError] = useState<FormError>()
  const [emailSavedResponse, setEmailSavedResponse] = useState<EmailSavedResponse>()
  const [showChangeEmailModal, openChangeEmailModal, closeChangeEmailModal] = useToggleState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showPhoneModal, openPhoneModal, closePhoneModal] = useToggleState(!phoneNumber)
  const formRef = useRef<HTMLFormElement>(null)

  const fullName = `${title ? title + " " : ""}${firstName} ${lastName}`
  const isAccountDetailsPage = location.pathname === "/account"

  useEffect(() => {
    if (!actionDataHook) {
      return
    }

    if (isEmailSavedResponse(actionDataHook)) {
      setEmailSavedResponse(actionDataHook)
      closeChangeEmailModal()
      window.location.href = "/account"
      return
    }

    if (isCustomerUpdatedResponse(actionDataHook)) {
      setIsEditing(false)
      setFormError(undefined)
      closePhoneModal()
      window.location.href = "/account"
      return
    }

    if (isFormError(actionDataHook)) {
      setFormError(actionDataHook)
      return
    }
  }, [actionDataHook, closeChangeEmailModal, closePhoneModal])

  useEffect(() => {
    formRef.current?.reset()
  }, [activeCustomer])

  return (
    <>
      <Dialog open={showChangeEmailModal} onOpenChange={closeChangeEmailModal}>
        <DialogContent className="sm:max-w-lg border-none bg-white shadow-2xl">
          <ValidatedForm validator={changeEmailValidator} method="post">
            <DialogHeader className="space-y-3 pb-2">
              <DialogTitle className="text-2xl font-semibold">{t("account.changeEmailModal.title")}</DialogTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("account.changeEmailModal.heading")}</p>
            </DialogHeader>

            <div className="space-y-5 py-6">
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Current Email
                </Label>
                <p className="text-sm font-medium">{emailAddress}</p>
              </div>

              <div className="space-y-2">
                <input type="hidden" name="intent" value={FormIntent.UpdateEmail} />
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("account.changeEmailModal.new")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoFocus
                  required
                  placeholder="Enter new email address"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Confirm with your password"
                  className="h-11"
                />
              </div>

              {formError && formError.intent === FormIntent.UpdateEmail && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive font-medium">{formError.message}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeChangeEmailModal}
                className="h-11 px-6 bg-transparent"
              >
                {t("common.cancel")}
              </Button>
              <HighlightedButton type="submit" isSubmitting={state === "submitting"} className="h-11 px-6">
                {state === "submitting" ? "Saving..." : t("common.save")}
              </HighlightedButton>
            </DialogFooter>
          </ValidatedForm>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-[#ffedc7]">
        <AccountHeader
          activeCustomer={{
            ...activeCustomer,
            phoneNumber: activeCustomer.phoneNumber || null,
          }}
        />

        <div>
          {isAccountDetailsPage ? (
            <AccountDetailsContent
              activeCustomer={activeCustomer}
              fullName={fullName}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              emailSavedResponse={emailSavedResponse}
              openChangeEmailModal={openChangeEmailModal}
              formError={formError}
              formRef={formRef}
              state={state}
              t={t}
            />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </>
  )
}

function AccountDetailsContent({
  activeCustomer,
  fullName,
  isEditing,
  setIsEditing,
  emailSavedResponse,
  openChangeEmailModal,
  formError,
  formRef,
  state,
  t,
}: {
  activeCustomer: any
  fullName: string
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  emailSavedResponse: EmailSavedResponse | undefined
  openChangeEmailModal: () => void
  formError: FormError | undefined
  formRef: React.RefObject<HTMLFormElement>
  state: string
  t: any
}) {
  const { firstName, lastName, title, phoneNumber, emailAddress } = activeCustomer

  return (
    <div className="min-h-screen bg-[#ffedc7]">
      <div className="px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <Card className="overflow-visible bg-gradient-to-br from-blue-50 to-slate-50 shadow-sm border-blue-100/60 rounded-2xl">
            <CardHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-700" />
                    </div>
                    Contact Information
                  </CardTitle>
                  <CardDescription className="text-base">Your personal details and contact information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-visible">
              {isEditing ? (
                <div className="space-y-6">
                  <ValidatedForm
                    validator={validator}
                    formRef={formRef}
                    method="post"
                    id="details"
                    defaultValues={{
                      title: activeCustomer.title ?? "None",
                      firstName: activeCustomer.firstName,
                      lastName: activeCustomer.lastName,
                      phoneNumber: activeCustomer.phoneNumber ?? "",
                    }}
                  >
                    <input type="hidden" name="intent" value={FormIntent.UpdateDetails} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <div className="max-w-xs">
                          <Label htmlFor="title" className="text-sm font-semibold mb-2 block">
                            Title
                          </Label>
                          <Select name="title" defaultValue={title || "None"}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr.">Mr.</SelectItem>
                              <SelectItem value="Mrs.">Mrs.</SelectItem>
                              <SelectItem value="Miss.">Miss.</SelectItem>
                              <SelectItem value="Ms.">Ms.</SelectItem>
                              <SelectItem value="Dr.">Dr.</SelectItem>
                              <SelectItem value="Prof.">Prof.</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="firstName" className="text-sm font-semibold mb-2 block">
                          First Name *
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          className="h-11"
                          defaultValue={firstName || ""}
                        />
                      </div>

                      <div>
                        <Label htmlFor="lastName" className="text-sm font-semibold mb-2 block">
                          Last Name *
                        </Label>
                        <Input id="lastName" name="lastName" required className="h-11" defaultValue={lastName || ""} />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="phoneNumber" className="text-sm font-semibold mb-2 block">
                          Phone Number
                        </Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          className="h-11 max-w-md"
                          defaultValue={phoneNumber || ""}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    {formError && formError.intent === FormIntent.UpdateDetails && (
                      <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-sm text-destructive font-medium">{formError.message}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-6">
                      <HighlightedButton type="submit" isSubmitting={state === "submitting"} className="h-11 px-6">
                        <Check className="w-4 h-4 mr-2" />
                        {state === "submitting" ? "Saving..." : "Save Changes"}
                      </HighlightedButton>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-11 px-6">
                        Cancel
                      </Button>
                    </div>
                  </ValidatedForm>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Full Name
                      </Label>
                      <p className="text-base font-medium text-gray-900">{replaceEmptyString(fullName)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        Phone Number
                      </Label>
                      <p className="text-base font-medium text-gray-900">
                        {replaceEmptyString(phoneNumber) || (
                          <span className="text-muted-foreground italic">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <Button
                      variant="default"
                      onClick={() => setIsEditing(true)}
                      className="h-11 px-6 bg-[#FF4D4D] hover:bg-[#FF6B6B] text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm border-emerald-100/60 rounded-2xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Mail className="h-5 w-5 text-emerald-700" />
                </div>
                Email Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <p className="font-medium text-base text-gray-900 break-all">{emailAddress}</p>
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200 rounded-full px-3 py-1 shrink-0"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>

                {/* <Button
                  variant="outline"
                  onClick={openChangeEmailModal}
                  className="w-full sm:w-auto h-11 px-6 shrink-0 bg-[#FF4D4D] hover:bg-[#FF6B6B] text-white border-emerald-200"
                >
                  Change Email
                </Button> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}