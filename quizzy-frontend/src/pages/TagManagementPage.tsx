import { Box, Button, Heading, HStack, Input, Separator, Table, Text, VStack } from "@chakra-ui/react";
import { Tag } from "@quizzy/base/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Quizzy } from "@/data";
import { withHandler } from "@/components/handler";
import PageToolbar from "@/components/PageToolbar";
import { useSelection } from "@/utils/react";
import { useDialog } from "@/utils/chakra";
import TagEditDialog, { TagEditDialogData, TagEditDialogResult } from "@/dialogs/TagEditDialog";

const mergeSelectedTags = withHandler(
  async (ids: string[]) => {
    if (ids.length < 2) {
      throw new Error('Need at least 2 tags to merge');
    }
    return await Quizzy.mergeTags(ids);
  },
  {
    async: true,
    cache: false,
    notifySuccess: () => 'Tags merged successfully',
  }
);

const deleteTag = withHandler(
  async (id: string) => {
    return await Quizzy.deleteTag(id);
  },
  {
    async: true,
    cache: false,
    notifySuccess: () => 'Tag deleted successfully',
  }
);

const updateTag = withHandler(
  async (id: string, updates: { mainName: string; alternatives: string[] }) => {
    return await Quizzy.updateTag(id, updates);
  },
  {
    async: true,
    cache: false,
    notifySuccess: () => 'Tag updated successfully',
  }
);

export const TagManagementPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const selection = useSelection();
  const editDialog = useDialog<TagEditDialogData, TagEditDialogResult>(TagEditDialog);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all tags
  const { data: tags = [], refetch } = useQuery({
    queryKey: ['tag-list'],
    queryFn: () => Quizzy.listTags(),
  });

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    const query = searchQuery.toLowerCase();
    return tags.filter(tag => 
      tag.mainName.toLowerCase().includes(query) ||
      tag.alternatives.some(alt => alt.toLowerCase().includes(query))
    );
  }, [tags, searchQuery]);

  const selectedIds = selection.getAllSelected();
  const selectedCount = selectedIds.length;
  const canMerge = selectedCount >= 2;

  const handleMerge = async () => {
    if (!canMerge) return;
    await mergeSelectedTags(selectedIds);
    selection.clearSelection();
    refetch();
    queryClient.invalidateQueries({ queryKey: ['tag-list'] });
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('page.tagManagement.confirmDelete'))) {
      await deleteTag(id);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tag-list'] });
    }
  };

  const handleEdit = async (tag: Tag) => {
    const result = await editDialog.open({ tag });
    if (result) {
      await updateTag(tag.id, result);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tag-list'] });
    }
  };

  return (
    <VStack alignItems="stretch" gap={4} p={4}>
      <Heading size="lg">{t('page.tagManagement.title')}</Heading>
      
      <PageToolbar>
        <Input
          placeholder={t('page.tagManagement.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          maxW="300px"
        />
        <Button
          onClick={handleMerge}
          disabled={!canMerge}
          colorPalette="purple"
        >
          {t('page.tagManagement.btn.merge')} ({selectedCount})
        </Button>
        <Button onClick={() => selection.clearSelection()} disabled={!selection.isAnySelected}>
          {t('common.btn.clearSelect')}
        </Button>
      </PageToolbar>

      <Separator />

      <Table.Root variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader width="50px">
              {t('page.tagManagement.table.select')}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t('page.tagManagement.table.name')}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t('page.tagManagement.table.alternatives')}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t('page.tagManagement.table.id')}
            </Table.ColumnHeader>
            <Table.ColumnHeader width="200px">
              {t('page.tagManagement.table.actions')}
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredTags.map((tag) => (
            <Table.Row key={tag.id}>
              <Table.Cell>
                <input
                  type="checkbox"
                  checked={selection.isSelected(tag.id)}
                  onChange={() => selection.toggleSelected(tag.id)}
                />
              </Table.Cell>
              <Table.Cell>
                <Text fontWeight="bold">{tag.mainName}</Text>
              </Table.Cell>
              <Table.Cell>
                <Text fontSize="sm" color="gray.600">
                  {tag.alternatives.filter(alt => alt !== tag.mainName).join(', ')}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text fontSize="xs" fontFamily="mono" color="gray.500">
                  {tag.id}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <HStack gap={2}>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tag)}>
                    {t('common.btn.edit')}
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={() => handleDelete(tag.id)}
                  >
                    {t('common.btn.delete')}
                  </Button>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {filteredTags.length === 0 && (
        <Box textAlign="center" p={8} color="gray.500">
          {searchQuery 
            ? t('page.tagManagement.noResults')
            : t('page.tagManagement.noTags')
          }
        </Box>
      )}

      <Box fontSize="sm" color="gray.600">
        {t('page.tagManagement.totalTags', { count: tags.length })}
      </Box>

      <editDialog.Root />
    </VStack>
  );
};

export default TagManagementPage;
