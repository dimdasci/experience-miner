interface SummaryProps {
  summaryText: string;
  basedOnInterviews: number[];
}

const Summary = ({ summaryText, basedOnInterviews }: SummaryProps) => {
  return (
    <div>
      <p className="text-mobile-body-lg-lh md:text-body-lg text-primary leading-relaxed font-medium">{summaryText}</p>
      <div className="mt-4 text-body text-secondary">
        Based on {basedOnInterviews.length} interview(s)
      </div>
    </div>
  );
};

export default Summary;