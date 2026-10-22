import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** თუ ერთი გვერდი გატყდა, მთელი საიტი შავად აღარ რჩება: ჩანს შეტყობინება და მენიუ მუშაობს. */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // სხვა გვერდზე გადასვლისას თავიდან ვცდით
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <div className="text-4xl">🏀</div>
        <h2 className="text-xl font-semibold">ეს გვერდი ვერ ჩაიტვირთა</h2>
        <p className="text-sm text-muted-foreground">
          სავარაუდოდ მონაცემები ჯერ ახლდება. სცადე გვერდის განახლება.
          <br />
          <span className="text-xs opacity-60">{this.state.error.message}</span>
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw /> განახლება
        </Button>
      </div>
    );
  }
}
