interface AuthSplitLayoutProps {
  headline: string;
  description: string;
  footerNote?: string;
  children: React.ReactNode;
}

export function AuthSplitLayout({
  headline,
  description,
  footerNote,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col justify-between bg-[#0B1220] px-8 py-10 text-white lg:w-[39%] lg:px-12 lg:py-14">
        <div className="max-w-sm">
          <p className="text-base font-bold tracking-wide text-white">ESTOK</p>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-white sm:text-[28px] sm:leading-tight">
            {headline}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {description}
          </p>
        </div>

        {footerNote ? (
          <p className="mt-10 text-xs text-slate-500">{footerNote}</p>
        ) : (
          <div />
        )}
      </aside>

      <main className="flex flex-1 items-center justify-center bg-[#F8FAFC] px-6 py-12">
        <div className="w-full max-w-[430px] rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
          {children}
        </div>
      </main>
    </div>
  );
}
