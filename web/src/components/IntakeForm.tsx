import { useState } from 'react';
import type { AdviseRequest, CarType, HeatingType, HomeType } from '../lib/types';

interface Props {
  onSubmit: (data: AdviseRequest) => void;
  loading: boolean;
}

const REGIONS = [
  'United Kingdom',
  'United States',
  'European Union',
  'Australia',
  'Canada',
  'India',
  'Other',
];

export function IntakeForm({ onSubmit, loading }: Props) {
  const [householdSize, setHouseholdSize] = useState(2);
  const [region, setRegion] = useState('United Kingdom');
  const [homeType, setHomeType] = useState<HomeType>('house');

  const [carType, setCarType] = useState<CarType>('petrol');
  const [kmPerWeek, setKmPerWeek] = useState(150);
  const [shortHaul, setShortHaul] = useState(2);
  const [longHaul, setLongHaul] = useState(1);
  const [cyclesRegularly, setCyclesRegularly] = useState(false);

  const [redMeatDays, setRedMeatDays] = useState(3);
  const [dairyHeavy, setDairyHeavy] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);

  const [kwhPerMonth, setKwhPerMonth] = useState(300);
  const [heating, setHeating] = useState<HeatingType>('gas');

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (householdSize < 1 || householdSize > 20) e.householdSize = 'Must be 1–20';
    if (!region.trim()) e.region = 'Required';
    if (kmPerWeek < 0 || kmPerWeek > 5000) e.kmPerWeek = 'Must be 0–5000';
    if (shortHaul < 0 || shortHaul > 100) e.shortHaul = 'Must be 0–100';
    if (longHaul < 0 || longHaul > 50) e.longHaul = 'Must be 0–50';
    if (redMeatDays < 0 || redMeatDays > 7) e.redMeatDays = 'Must be 0–7';
    if (kwhPerMonth < 0 || kwhPerMonth > 10000) e.kwhPerMonth = 'Must be 0–10 000';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      profile: { householdSize, region, homeType },
      state: {
        transport: { carType, kmPerWeek, flightsPerYear: { shortHaul, longHaul }, cyclesRegularly },
        diet: { redMeatDaysPerWeek: redMeatDays, dairyHeavy, vegetarian },
        energy: { kwhPerMonth, heating },
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="intake-form" noValidate aria-label="Carbon footprint intake form">
      <section aria-labelledby="profile-heading">
        <h2 id="profile-heading">Household</h2>
        <div className="field">
          <label htmlFor="householdSize">People in household</label>
          <input
            id="householdSize"
            type="number"
            min={1} max={20}
            value={householdSize}
            onChange={e => setHouseholdSize(Number(e.target.value))}
            aria-describedby={errors.householdSize ? 'householdSize-err' : undefined}
          />
          {errors.householdSize && <span id="householdSize-err" className="field-error" role="alert">{errors.householdSize}</span>}
        </div>
        <div className="field">
          <label htmlFor="region">Region / country</label>
          <select id="region" value={region} onChange={e => setRegion(e.target.value)}>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="field">
          <fieldset>
            <legend>Home type</legend>
            {(['house', 'apartment'] as HomeType[]).map(t => (
              <label key={t} className="radio-label">
                <input type="radio" name="homeType" value={t} checked={homeType === t} onChange={() => setHomeType(t)} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </label>
            ))}
          </fieldset>
        </div>
      </section>

      <section aria-labelledby="transport-heading">
        <h2 id="transport-heading">Transport</h2>
        <div className="field">
          <label htmlFor="carType">Car type</label>
          <select id="carType" value={carType} onChange={e => setCarType(e.target.value as CarType)}>
            <option value="none">No car</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="hybrid">Hybrid</option>
            <option value="ev">Electric (EV)</option>
          </select>
        </div>
        {carType !== 'none' && (
          <div className="field">
            <label htmlFor="kmPerWeek">Km driven per week</label>
            <input
              id="kmPerWeek" type="number" min={0} max={5000}
              value={kmPerWeek} onChange={e => setKmPerWeek(Number(e.target.value))}
              aria-describedby={errors.kmPerWeek ? 'kmPerWeek-err' : undefined}
            />
            {errors.kmPerWeek && <span id="kmPerWeek-err" className="field-error" role="alert">{errors.kmPerWeek}</span>}
          </div>
        )}
        <div className="field-row">
          <div className="field">
            <label htmlFor="shortHaul">Short-haul flights / year</label>
            <input
              id="shortHaul" type="number" min={0} max={100}
              value={shortHaul} onChange={e => setShortHaul(Number(e.target.value))}
              aria-describedby={errors.shortHaul ? 'shortHaul-err' : undefined}
            />
            {errors.shortHaul && <span id="shortHaul-err" className="field-error" role="alert">{errors.shortHaul}</span>}
          </div>
          <div className="field">
            <label htmlFor="longHaul">Long-haul flights / year</label>
            <input
              id="longHaul" type="number" min={0} max={50}
              value={longHaul} onChange={e => setLongHaul(Number(e.target.value))}
              aria-describedby={errors.longHaul ? 'longHaul-err' : undefined}
            />
            {errors.longHaul && <span id="longHaul-err" className="field-error" role="alert">{errors.longHaul}</span>}
          </div>
        </div>
        <div className="field checkbox-field">
          <input id="cyclesRegularly" type="checkbox" checked={cyclesRegularly} onChange={e => setCyclesRegularly(e.target.checked)} />
          <label htmlFor="cyclesRegularly">I cycle or walk regularly for short trips</label>
        </div>
      </section>

      <section aria-labelledby="diet-heading">
        <h2 id="diet-heading">Diet</h2>
        <div className="field">
          <label htmlFor="redMeatDays">Days per week with red meat</label>
          <input
            id="redMeatDays" type="number" min={0} max={7}
            value={redMeatDays} onChange={e => setRedMeatDays(Number(e.target.value))}
            aria-describedby={errors.redMeatDays ? 'redMeatDays-err' : undefined}
          />
          {errors.redMeatDays && <span id="redMeatDays-err" className="field-error" role="alert">{errors.redMeatDays}</span>}
        </div>
        <div className="field checkbox-field">
          <input id="dairyHeavy" type="checkbox" checked={dairyHeavy} onChange={e => setDairyHeavy(e.target.checked)} />
          <label htmlFor="dairyHeavy">Heavy dairy consumption (cheese, milk, yoghurt daily)</label>
        </div>
        <div className="field checkbox-field">
          <input id="vegetarian" type="checkbox" checked={vegetarian} onChange={e => setVegetarian(e.target.checked)} />
          <label htmlFor="vegetarian">Vegetarian or vegan diet</label>
        </div>
      </section>

      <section aria-labelledby="energy-heading">
        <h2 id="energy-heading">Home energy</h2>
        <div className="field">
          <label htmlFor="kwhPerMonth">Electricity use (kWh/month)</label>
          <input
            id="kwhPerMonth" type="number" min={0} max={10000}
            value={kwhPerMonth} onChange={e => setKwhPerMonth(Number(e.target.value))}
            aria-describedby={errors.kwhPerMonth ? 'kwhPerMonth-err' : undefined}
          />
          {errors.kwhPerMonth && <span id="kwhPerMonth-err" className="field-error" role="alert">{errors.kwhPerMonth}</span>}
        </div>
        <div className="field">
          <label htmlFor="heating">Primary heating source</label>
          <select id="heating" value={heating} onChange={e => setHeating(e.target.value as HeatingType)}>
            <option value="gas">Gas boiler</option>
            <option value="electric">Electric</option>
            <option value="heatpump">Heat pump</option>
            <option value="other">Other</option>
          </select>
        </div>
      </section>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Calculating…' : 'Calculate my footprint'}
      </button>
    </form>
  );
}
