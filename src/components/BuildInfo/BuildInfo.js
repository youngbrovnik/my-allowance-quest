import React from 'react';
import './BuildInfo.css';

const version = process.env.REACT_APP_VERSION;
const commit = process.env.REACT_APP_COMMIT;
const builtAt = process.env.REACT_APP_BUILD_TIME;
const modified = process.env.REACT_APP_BUILD_MODIFIED === 'true';
const formattedTime = builtAt && new Date(builtAt).toLocaleString('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

export default function BuildInfo() {
  return (
    <footer className="build-info" aria-label="앱 버전 정보">
      <span className="build-version">{version ? `v${version}` : '개발 버전'}</span>
      {builtAt && (
        <details>
          <summary>배포 정보</summary>
          <p>빌드: <time dateTime={builtAt}>{formattedTime}</time> (한국 시간)</p>
          <p>커밋: {commit === 'unknown' ? '확인 불가' : commit}{modified ? ' · 미커밋 변경 포함' : ''}</p>
        </details>
      )}
    </footer>
  );
}
