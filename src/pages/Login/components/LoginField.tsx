import { Form, Input } from 'antd';
import type { Rule } from 'antd/es/form';
import styles from '../index.module.scss';

type LoginFieldProps = {
  name: 'email' | 'password';
  id: string;
  label: string;
  placeholder: string;
  rules: Rule[];
  password?: boolean;
  type?: string;
  autoComplete?: string;
  headerExtra?: React.ReactNode;
};

const LoginField: React.FC<LoginFieldProps> = ({
  name,
  id,
  label,
  placeholder,
  rules,
  password = false,
  type,
  autoComplete,
  headerExtra,
}) => {
  return (
    <div className={styles.fieldGroup}>
      <div className={styles.fieldHeader}>
        <label className={styles.fieldLabel} htmlFor={id}>
          {label}
        </label>
        {headerExtra}
      </div>
      <Form.Item name={name} className={styles.fieldItem} rules={rules}>
        {password ? (
          <Input.Password
            id={id}
            size="large"
            className={styles.fieldControl}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        ) : (
          <Input
            id={id}
            type={type}
            size="large"
            className={styles.fieldControl}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        )}
      </Form.Item>
    </div>
  );
};

export default LoginField;
