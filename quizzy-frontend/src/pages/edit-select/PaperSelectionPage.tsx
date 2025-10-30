import PageToolbar from "@/components/PageToolbar";
import { PaperCard } from "@/components/item-brief/PaperCard";
import { usePapers } from "@/data/papers";
import { Button, VStack, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import ConflictResolutionDialog from "@/dialogs/ConflictResolutionDialog";

export const PaperSelectionPage = () => {

  const papers = usePapers();
  const { t } = useTranslation();

  return <>
    <VStack alignItems='stretch' minH='700px'>

      <PageToolbar>
        <Button onClick={papers.create}>
          {t('page.edit.btn.create')}
        </Button>
        <Button onClick={papers.importPaper}>
          {t('page.edit.btn.importPaper')}
        </Button>
        <Button onClick={papers.upload}>
          {t('page.edit.btn.importCompletePaper')}
        </Button>
      </PageToolbar>

      <Wrap>
        {papers.value.map(p => <PaperCard
          key={p.id}
          paper={p}
          onStart={() => papers.start(p.id)}
          onEdit={() => papers.edit(p.id)}
        />)}
      </Wrap>
    </VStack>

    <ConflictResolutionDialog
      open={papers.showConflictDialog}
      conflicts={papers.pendingConflicts}
      onResolve={papers.handleConflictResolution}
      onCancel={papers.handleConflictCancel}
    />
  </>;
};

export default PaperSelectionPage;