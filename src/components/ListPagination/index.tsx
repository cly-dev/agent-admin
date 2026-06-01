import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/constants/pagination';
import { useIntl } from '@umijs/max';
import { Pagination } from 'antd';
import styles from './index.module.scss';

type ListPaginationProps = {
  page: number;
  pageSize?: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
};

const ListPagination: React.FC<ListPaginationProps> = ({
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  total,
  onChange,
}) => {
  const intl = useIntl();

  if (total <= 0) {
    return null;
  }

  return (
    <div className={styles.listPagination}>
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        showSizeChanger
        pageSizeOptions={PAGE_SIZE_OPTIONS.map(String)}
        showTotal={(count, range) =>
          intl.formatMessage(
            { id: 'common.pagination.total' },
            { start: range[0], end: range[1], total: count },
          )
        }
        onChange={onChange}
      />
    </div>
  );
};

export default ListPagination;
