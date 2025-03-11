import PageToolbar from "@/components/PageToolbar";
import { PaperCard } from "@/components/item-brief/PaperCard";
import { usePapers } from "@/data/papers";
import { Button, VStack, Wrap } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export const PaperSelectionPage = () => {

  const papers = usePapers();
  const { t } = useTranslation();

  return <VStack alignItems='stretch' minH='700px'>

    <PageToolbar>
      <Button onClick={papers.create}>
        {t('page.edit.btn.create')}
      </Button>
      <Button onClick={papers.upload}>
        {t('page.edit.btn.upload')}
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
  </VStack>;
};

export default PaperSelectionPage;