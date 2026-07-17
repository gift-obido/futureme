import React, { useId } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useResolvedDark } from '../../lib/theme';

export interface WeightPoint {
  date: string; // ISO
  label: string; // short display date
  weight: number; // in display unit
}

interface WeightChartProps {
  points: WeightPoint[];
  unit: string; // 'kg' | 'lb'
  target?: number | null;
}

const palette = (dark: boolean) =>
  dark
    ? { line: '#D6E6E4', grid: '#33302A', axis: '#A8A196', surface: '#211F19', ref: '#A8A196' }
    : { line: '#7F7767', grid: '#E4E0D4', axis: '#5B574E', surface: '#FFFFFF', ref: '#5B574E' };

const ChartTooltip: React.FC<{ active?: boolean; payload?: { value: number }[]; label?: string; unit: string }> = ({
  active,
  payload,
  label,
  unit,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-elevated px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-text">{label}</p>
      <p className="stat text-muted">
        {payload[0].value} {unit}
      </p>
    </div>
  );
};

/**
 * Accessible weight trend: labelled figure with a text description, an
 * aria-hidden SVG chart (so AT isn't confused by the raw SVG), and an
 * expandable data table fallback. Legible in both themes; the target line is
 * distinguished by dashes + label, not colour alone.
 */
export const WeightChart: React.FC<WeightChartProps> = ({ points, unit, target }) => {
  const dark = useResolvedDark();
  const c = palette(dark);
  const titleId = useId();
  const descId = useId();

  const first = points[0]?.weight ?? 0;
  const last = points[points.length - 1]?.weight ?? 0;
  const delta = Math.round((last - first) * 10) / 10;
  const trend = delta === 0 ? 'no net change' : delta < 0 ? `down ${Math.abs(delta)} ${unit}` : `up ${delta} ${unit}`;
  const desc = `Weight from ${first} to ${last} ${unit} across ${points.length} entries — ${trend}${
    target ? `. Target ${target} ${unit}.` : '.'
  }`;

  const ys = points.map((p) => p.weight);
  if (target) ys.push(target);
  const minY = Math.floor(Math.min(...ys)) - 1;
  const maxY = Math.ceil(Math.max(...ys)) + 1;

  return (
    <figure className="m-0" aria-labelledby={titleId} aria-describedby={descId}>
      <figcaption>
        <h2 id={titleId} className="font-display text-lg font-semibold text-text">
          Weight over time
        </h2>
        <p id={descId} className="mt-0.5 text-sm text-muted">
          {desc}
        </p>
      </figcaption>

      <div aria-hidden="true" className="mt-4 h-56 w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: c.axis, fontSize: 11 }} stroke={c.grid} tickMargin={8} />
            <YAxis
              domain={[minY, maxY]}
              tick={{ fill: c.axis, fontSize: 11 }}
              stroke={c.grid}
              width={40}
              tickFormatter={(v) => `${Math.round(v)}`}
            />
            {target ? (
              <ReferenceLine
                y={target}
                stroke={c.ref}
                strokeDasharray="6 4"
                label={{ value: 'Target', fill: c.ref, fontSize: 11, position: 'insideTopRight' }}
              />
            ) : null}
            <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: c.axis, strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={c.line}
              strokeWidth={2.5}
              dot={{ r: 3, fill: c.line, stroke: c.surface, strokeWidth: 1.5 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-muted hover:text-text">Show data table</summary>
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">Weight entries over time, in {unit}</caption>
          <thead>
            <tr className="border-b border-hairline">
              <th scope="col" className="py-1.5 text-left font-semibold text-muted">Date</th>
              <th scope="col" className="py-1.5 text-right font-semibold text-muted">Weight ({unit})</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} className="border-b border-hairline/60">
                <td className="py-1.5 text-text">{p.label}</td>
                <td className="stat py-1.5 text-right text-text">{p.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
};
