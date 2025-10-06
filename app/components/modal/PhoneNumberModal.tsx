import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { HighlightedButton } from '~/components/HighlightedButton';
import { withZod } from '@remix-validated-form/with-zod';
import { ValidatedForm } from 'remix-validated-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

export enum FormIntent {
  UpdatePhone = 'updatePhone',
}

export type FormError = {
  message: string;
  intent?: string;
};

export const phoneNumberValidator = withZod(
  z.object({
    phoneNumber: z
      .string()
      .min(1, { message: 'Phone number is required' })
      .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' }),
  }),
);

interface PhoneNumberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formError?: FormError;
  isSubmitting: boolean;
  fetcher: any;
}

export function PhoneNumberModal({
  open,
  onOpenChange,
  formError,
  isSubmitting,
  fetcher,
}: PhoneNumberModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <ValidatedForm
          validator={phoneNumberValidator}
          method="post"
          id="phone-number-form"
          fetcher={fetcher}
          action="/account"
        >
          <DialogHeader>
            <DialogTitle>Add PhoneNumber</DialogTitle>
            <DialogDescription>
              Please enter your phone number to help us secure your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <input
              type="hidden"
              name="intent"
              value={FormIntent.UpdatePhone}
            />
            <div className="space-y-2">
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                placeholder="Enter 10 digit phone number"
                autoFocus
              />
            </div>

            {formError && formError.intent === FormIntent.UpdatePhone && (
              <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{formError.message}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <HighlightedButton type="submit" isSubmitting={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.save')}
            </HighlightedButton>
          </DialogFooter>
        </ValidatedForm>
      </DialogContent>
    </Dialog>
  );
}

