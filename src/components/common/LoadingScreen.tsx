import { LoaderCircle } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status">
      <div className="text-center text-mist">
        <LoaderCircle className="mx-auto mb-3 animate-spin text-gold" />
        正在展開命書…
      </div>
    </div>
  );
}
