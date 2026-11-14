import { useState, type FormEvent } from 'react';
import { ArrowRight, DeviceMobile, LockSimple } from '@phosphor-icons/react';
import { PRODUCT_NAME } from '../../../shared/content.js';
import { navigate } from '../lib/hooks';
import { newProfile, saveProfile } from '../lib/storage';
import { Button, Card } from '../components/ui';

export function CreateProfile() {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  function create(e: FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    saveProfile(newProfile(trimmed));
    navigate('#/setup');
  }

  return (
    <div className="split">
      <div className="stack-4">
        <h1 className="text-display">Create your {PRODUCT_NAME} profile</h1>
        <p className="text-body text-muted">
          You'll tell us your major, the classes you need this semester, how you like to learn and when you can be on campus.
          Then we rank every section of each class for you and build a schedule with no overlaps.
        </p>
        <p className="text-small"><a href="#/contribute">Taking a class now? Add your notes instead</a></p>
      </div>
      <Card>
        <form className="stack-4" onSubmit={create}>
          <label className="field">
            <span className="field__label">Your first name</span>
            <input className="input" id="first-name" type="text" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <ul className="privacy-list">
            <li className="privacy-list__item">
              <DeviceMobile className="privacy-list__icon" size={22} aria-hidden />
              <span className="text-small">Your profile is saved in this browser only, so come back on the same device to pick up where you left off.</span>
            </li>
            <li className="privacy-list__item">
              <LockSimple className="privacy-list__icon" size={22} aria-hidden />
              <span className="text-small">There's no password because our server never stores your profile. Your answers are only sent when we rank sections.</span>
            </li>
          </ul>
          <Button type="submit" block disabled={!trimmed} iconAfter={<ArrowRight size={18} aria-hidden />}>
            {trimmed ? `Create ${trimmed}'s profile` : 'Create my profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
