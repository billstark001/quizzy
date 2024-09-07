/* eslint-disable comma-spacing */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTagStyle } from '#/utils/react';
import { Box, HTMLChakraProps, Table, TableBodyProps, TableHeadProps, TableProps, TableRowProps, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { ReactNode, PropsWithChildren, ReactElement, createContext, useContext, ComponentType } from 'react';

/**
 * Props for a table row that includes the item data and index.
 * @template T The type of the item data.
 */
export type TableRowWithItemProps<T> = TableRowProps & {
  item: T;
  index: number;
}

type _StyleRenderer<I, T> = T | ((obj: I, index: number) => T | undefined);

/**
 * Props for the Sheet component.
 * @template T The type of the data items.
 */
export type SheetProps<T> = PropsWithChildren<{
  /** The data to be displayed in the sheet. */
  data: readonly T[];
  /** Content to display when there's no data. */
  noData?: ReactNode;
  /** Callback function when a row is selected. */
  onSelected?: (obj: T, index: number) => void;
  /** Style for cells, can be a fixed style or a function that returns a style based on the item and index. */
  cellStyle?: _StyleRenderer<T, ReactElement<HTMLChakraProps<'td'>>>,
  /** Style for rows, can be a fixed style or a function that returns a style based on the item and index. */
  rowStyle?: _StyleRenderer<T, ReactElement<HTMLChakraProps<'tr'>>>,
  /** Style for header cells. */
  cellStyleHeader?: ReactElement<HTMLChakraProps<'th'>>,
  /** Style for the header row. */
  rowStyleHeader?: ReactElement<HTMLChakraProps<'tr'>>,
  /** Custom wrapper component for the table head. */
  theadWrapper?: ComponentType<TableHeadProps>,
  /** Custom wrapper component for the table body. */
  tbodyWrapper?: ComponentType<TableBodyProps>,
  /** Custom wrapper component for table rows. */
  trWrapper?: ComponentType<TableRowWithItemProps<T>>,
}> & TableProps;

/**
 * Props for the Column component.
 * @template T The type of the data item.
 * @template K The type of the field key in the data item.
 */
export type ColumnProps<
  T extends object = Record<string, any>,
  K extends keyof T = keyof T
> = PropsWithChildren<{
  /** The field key in the data item to display in this column. */
  field?: K,
  /** The header content for this column. */
  header?: ReactNode,
  /** Custom render function for the cell content. */
  render?: (value: T[K], item: T, index: number) => ReactNode,
}>;

type RenderStage = {
  stage: 'head',
  style?: HTMLChakraProps<'th'>
} | {
  stage: 'body',
  style?: HTMLChakraProps<'td'>
};

const RenderStageContext = createContext<RenderStage>({
  stage: 'body',
});

type _I<T> = [number, T];

/**
 * Represents a row in the Sheet component.
 * @template T The type of the data item.
 */
export type SheetRow<T> = {
  /** The index of the row. */
  index: number;
  /** The data item for the row. */
  item: T;
  /** Indicates if this is a header row. */
  isHeader: boolean;
};

export const SheetRowContext = createContext<_I<unknown>>([-1, undefined]);

/**
 * Hook to access the current sheet row context.
 * @template T The type of the data item.
 * @returns The current sheet row information.
 */
export const useSheetRow = <T,>(): SheetRow<T> => {
  const [index, item] = useContext(SheetRowContext) as _I<T>;
  const { stage } = useContext(RenderStageContext);
  return {
    index,
    item,
    isHeader: stage === 'head',
  };
};

/**
 * Higher-order component to wrap a component with sheet row context.
 * @template T The type of the data item.
 * @template K The props type of the component being wrapped.
 * @param Component The component to wrap.
 * @returns A new component with sheet row context injected.
 */
export const withSheetRow = <T=any, K=Partial<SheetRow<T>>>(Component: ComponentType<K>) => {
  const WrappedComponent = (props: K & Partial<SheetRow<T>>) => {
    const context = useSheetRow<T>();
    return <Component {...context} {...props} />;
  };
  return WrappedComponent;
};

/**
 * Column component for the Sheet.
 * @template T The type of the data item.
 * @template K The type of the field key in the data item.
 */
export const Column = <T extends object = Record<string, any>, K extends keyof T = keyof T>(
  props: ColumnProps<T, K>
) => {
  const { stage, style } = useContext(RenderStageContext);
  const [index, item] = useContext(SheetRowContext) as _I<T>;
  const { header, field, render, children } = props;

  if (stage === 'head') {
    return <Th {...style ?? {}}>
      {header ?? <Box>{field as string}</Box>}
    </Th>;
  }

  // else it is rendering body
  let fieldDisplay: ReactNode;
  const fieldValue = field != null
    ? item?.[field]
    : undefined;
  if (render) {
    fieldDisplay = render(fieldValue as T[K], item, index);
  } else {
    fieldDisplay = fieldValue != null
      ? String(fieldValue) : undefined;
  }
  return <Td {...style ?? {}}>{fieldDisplay}{children}</Td>;
};

/**
 * Sheet component for displaying tabular data.
 * @template T The type of the data items.
 */
export const Sheet = <T extends object = Record<string, any>>(
  props: SheetProps<T>
) => {
  const {
    data, noData, onSelected, children,
    cellStyle: cellStyleProvider,
    rowStyle: rowStyleProvider,
    cellStyleHeader,
    rowStyleHeader,
    theadWrapper,
    tbodyWrapper,
    trWrapper,
    ...tableProps
  } = props;

  if (!data || data.length === 0) {
    return <div>{noData ?? 'NO DATA'}</div>;
  }

  const TheadWrapper = theadWrapper ?? Thead;
  const TbodyWrapper = tbodyWrapper ?? Tbody;
  const TrWrapper = trWrapper ?? Tr;

  const bodyRowRenderer = (item: T, index: number) => {
    const rowStyle = getTagStyle(typeof rowStyleProvider === 'function'
      ? rowStyleProvider(item, index)
      : rowStyleProvider, true, Tr);

    const cellStyle = getTagStyle(typeof cellStyleProvider === 'function'
      ? cellStyleProvider(item, index)
      : cellStyleProvider, true, Td);

    return (
      <SheetRowContext.Provider value={[index, item]} key={index}>
        <RenderStageContext.Provider value={{ stage: 'body', style: cellStyle }}>
          <TrWrapper
            key={index}
            index={index}
            item={item}
            cursor={onSelected ? 'pointer' : 'default'}
            onClick={() => onSelected?.(item, index)}
            {...rowStyle}
          >
            {children}
          </TrWrapper>
        </RenderStageContext.Provider>
      </SheetRowContext.Provider>
    );
  };

  const thead = (
    <Tr {...getTagStyle(rowStyleHeader, true, Tr)}>
      <RenderStageContext.Provider value={{ stage: 'head', style: getTagStyle(cellStyleHeader, true, Th) }}>
        {children}
      </RenderStageContext.Provider>
    </Tr>
  );

  const tbody = data.map(bodyRowRenderer);

  return (
    <Table {...tableProps}>
      <TheadWrapper>{thead}</TheadWrapper>
      <TbodyWrapper>{tbody}</TbodyWrapper>
    </Table>
  );
};

export default Sheet;