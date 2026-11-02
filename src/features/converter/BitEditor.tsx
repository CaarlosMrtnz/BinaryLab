export function BitEditor({
  bits,
  onToggle,
}: {
  bits: string;
  onToggle: (position: number) => void;
}) {
  return (
    <div className="bit-editor">
      <div className="section-label">
        <h2>Explora los bits</h2>
        <span>MSB → LSB</span>
      </div>
      <p className="muted small">
        Pulsa un bit para cambiar su estado. Debajo, su peso decimal.
      </p>
      <div className="bits-grid">
        {[...bits].map((bit, i) => {
          const position = bits.length - i - 1,
            weight = (1n << BigInt(position)).toString();
          return (
            <div className="bit-cell" key={position}>
              <span className="bit-position">
                2<sup>{position}</sup>
              </span>
              <button
                className="bit"
                aria-pressed={bit === '1'}
                aria-label={`Bit ${position}, peso ${weight}, ${bit === '1' ? 'activado' : 'desactivado'}`}
                onClick={() => onToggle(position)}
              >
                {bit}
              </button>
              <span className="bit-weight" title={weight}>
                {weight.length > 5 ? `2^${position}` : weight}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
