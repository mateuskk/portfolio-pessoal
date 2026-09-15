import { LanguageProvider } from '@/components/providers/language-provider';
import { Site } from '@/components/site';

export default function Home() {
  return (
    <LanguageProvider>
      <Site />
    </LanguageProvider>
  );
}
