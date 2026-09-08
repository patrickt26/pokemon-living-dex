import { ArrowLeft, Boxes, Home } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';

export function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  return <section className="not-found" aria-labelledby="not-found-title">
    <div className="not-found-visual" aria-hidden="true">
      <span className="not-found-number">4</span>
      <span className="not-found-pokeball"><i /></span>
      <span className="not-found-number">4</span>
      <span className="not-found-question">?</span>
    </div>
    <div className="not-found-copy">
      <span className="eyebrow">{t('notFoundEyebrow')}</span>
      <h1 id="not-found-title">{t('notFoundTitle')}</h1>
      <p>{t('notFoundDescription')}</p>
      <code title={pathname}>{pathname}</code>
      <div className="not-found-actions">
        <Link className="not-found-primary" to="/"><Home size={18} />{t('backToDashboard')}</Link>
        <Link className="not-found-secondary" to="/national"><Boxes size={18} />{t('exploreNationalDex')}</Link>
      </div>
      <button className="not-found-back" type="button" onClick={() => navigate(-1)}><ArrowLeft size={15} />{t('goBack')}</button>
    </div>
  </section>;
}
