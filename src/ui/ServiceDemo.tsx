import { m } from 'motion/react'
import { ArrowRight, Braces, Check, Database, FileText, Mail, Webhook, Workflow } from 'lucide-react'
import { t } from '../lib/lang'

const flowTransition = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }

function Node({ icon, label, done = false }: { icon: React.ReactNode; label: string; done?: boolean }) {
  return (
    <m.span className={`system-demo__node${done ? ' is-done' : ''}`} whileHover={{ y: -2 }} transition={flowTransition}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </m.span>
  )
}

function Connector() {
  return <ArrowRight className="system-demo__arrow" aria-hidden="true" />
}

export default function ServiceDemo({ type }: { type: 'ai' | 'automatizace' | 'software' }) {
  if (type === 'ai') {
    return (
      <div className="system-demo" aria-label={t({ cs: 'Ukázka toku zpracování dokumentu pomocí AI', en: 'Example AI document processing flow' })}>
        <p className="system-demo__label">LIVE PIPELINE / AI-01</p>
        <div className="system-demo__flow">
          <Node icon={<FileText />} label={t({ cs: 'Dokument', en: 'Document' })} />
          <Connector />
          <Node icon={<Braces />} label={t({ cs: 'Extrakce', en: 'Extraction' })} />
          <Connector />
          <Node icon={<Database />} label={t({ cs: 'Data', en: 'Data' })} />
          <Connector />
          <Node icon={<Check />} label={t({ cs: 'Hotovo', en: 'Done' })} done />
        </div>
      </div>
    )
  }

  if (type === 'automatizace') {
    return (
      <div className="system-demo system-demo--compare" aria-label={t({ cs: 'Porovnání procesu před a po automatizaci', en: 'Process before and after automation' })}>
        <div className="system-demo__lane is-before">
          <span className="system-demo__label">{t({ cs: 'PŘED / 6 KROKŮ', en: 'BEFORE / 6 STEPS' })}</span>
          <span>{t({ cs: 'E-mail → člověk → dokument → přepis → kontrola → systém', en: 'Email → person → document → retype → check → system' })}</span>
        </div>
        <div className="system-demo__lane is-after">
          <span className="system-demo__label">{t({ cs: 'PO / ŘÍZENÝ TOK', en: 'AFTER / CONTROLLED FLOW' })}</span>
          <span className="system-demo__flow system-demo__flow--compact">
            <Mail aria-hidden="true" /><Connector /><Webhook aria-hidden="true" /><Connector /><Workflow aria-hidden="true" /><Connector /><Database aria-hidden="true" /><Connector /><Check aria-hidden="true" />
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="system-demo system-demo--product" aria-label={t({ cs: 'Ukázka produktového dashboardu a API', en: 'Product dashboard and API example' })}>
      <div className="system-demo__top">
        <span className="system-demo__label">PRODUCT CORE / ONLINE</span>
        <span className="system-demo__status"><i /> API 200</span>
      </div>
      <div className="system-demo__dashboard" aria-hidden="true">
        <span className="system-demo__sidebar" />
        <span className="system-demo__chart"><i /><i /><i /><i /><i /></span>
        <span className="system-demo__panel"><i /><i /><i /></span>
      </div>
    </div>
  )
}
