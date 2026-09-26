export default function Footer({ githubUrl, team = [] }) {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div>
          <p className="font-display text-[14px] font-semibold text-paper-100">FraudGuard</p>
          <p className="mt-1 text-[12.5px] text-paper-500">
            FinTech Fraud Detection Hackathon 2026
          </p>
        </div>
        <div className="flex flex-col gap-1 text-[12.5px] text-paper-500 sm:items-end">
          {team.length > 0 && <p>{team.join(" · ")}</p>}
          <a href={githubUrl} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
            View source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
