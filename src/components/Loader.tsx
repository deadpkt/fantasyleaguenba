export default function Loader({ error }: { error?: string }) {
  return (
    <div className="loader" role="status">
      {!error && <div className="spin" />}
      <div className={`ka${error ? " err" : ""}`}>
        {error
          ? "მონაცემები ვერ ჩაიტვირთა ESPN-იდან. სცადე გვერდის განახლება რამდენიმე წუთში."
          : "ESPN-იდან ვტვირთავ ლიგის მონაცემებს…"}
      </div>
      {error && <div className="note">{error}</div>}
    </div>
  );
}
