import './style.css';

interface IProps {
  percent: number;
}

const Progress = ({ percent }: IProps) => {
  return (
    <div className={`progress`}>
      <div style={{ width: `${percent || 0}%` }} className={`percent`} />
    </div>
  )
}

export default Progress;
