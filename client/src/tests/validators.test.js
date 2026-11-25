import { describe, expect, it } from 'vitest';
import {
  validateLoginForm,
  validateProfileForm,
  validateRegisterForm,
} from '../utils/validators';

describe('Client Form Validators', () => {
  it('validates registration fields and password confirmation', () => {
    const invalid = validateRegisterForm({
      name: 'J',
      email: 'not-an-email',
      password: 'abc',
      confirmPassword: 'xyz',
    });
    expect(invalid.name).toBeDefined();
    expect(invalid.email).toBeDefined();
    expect(invalid.password).toBeDefined();
    expect(invalid.confirmPassword).toBe('Passwords do not match.');

    const valid = validateRegisterForm({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password1',
      confirmPassword: 'Password1',
    });
    expect(Object.keys(valid)).toHaveLength(0);
  });

  it('validates login fields', () => {
    const invalid = validateLoginForm({ email: 'bad', password: '' });
    expect(invalid.email).toBeDefined();
    expect(invalid.password).toBeDefined();

    const valid = validateLoginForm({
      email: 'jane@example.com',
      password: 'Password1',
    });
    expect(Object.keys(valid)).toHaveLength(0);
  });

  it('validates optional password update in profile form', () => {
    const missingCurrent = validateProfileForm({
      name: 'Jane Doe',
      email: 'jane@example.com',
      currentPassword: '',
      newPassword: 'NewPassword1',
      confirmNewPassword: 'NewPassword2',
    });
    expect(missingCurrent.currentPassword).toBeDefined();
    expect(missingCurrent.confirmNewPassword).toBeDefined();
  });
});
