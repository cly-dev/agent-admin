import omnixLogo from '@/assets/logo/omnix_final_italic.png';
import styles from './index.module.scss';

type AppLogoProps = {
  collapsed?: boolean;
};

const AppLogo: React.FC<AppLogoProps> = ({ collapsed }) => {
  if (collapsed) {
    return (
      <div className={styles.rootCollapsed}>
        <div className={styles.logoWrap}>
          <img src={omnixLogo} alt="omnix" className={styles.logoCollapsed} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.logoWrap}>
        <img src={omnixLogo} alt="omnix" className={styles.logo} />
      </div>
    </div>
  );
};

export default AppLogo;
