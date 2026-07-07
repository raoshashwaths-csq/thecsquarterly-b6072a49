interface Props {
  id: number;
  title: string;
  tag: string;
  hoverText: string;
}

export function StripHeader({ id, title, tag, hoverText }: Props) {
  return (
    <div className="strip-header" title={hoverText}>
      <div>
        <div className="strip-header-number">No. {id}</div>
        <div className="strip-header-title">{title}</div>
      </div>
      <div className="strip-header-tag">{tag}</div>
    </div>
  );
}
