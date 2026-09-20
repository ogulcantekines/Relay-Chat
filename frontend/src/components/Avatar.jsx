import { useState } from 'react';

const Avatar = ({ src, name = '', alt = '', ...props }) => {
    const [failedSource, setFailedSource] = useState(null);
    const safeSource = typeof src === 'string' && (/^https:\/\//i.test(src) || /^\/(?!\/)/.test(src));
    if ((!safeSource || failedSource === src) && name) {
        const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr');
        return <svg {...props} width="80" height="80" viewBox="0 0 80 80" role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
            <rect width="80" height="80" rx="40" fill="#252e4a" />
            <text x="40" y="42" dy=".35em" textAnchor="middle" fill="#c7d2fe" fontFamily="system-ui, sans-serif" fontSize="29" fontWeight="600">{initials}</text>
        </svg>;
    }
    return <img {...props} src={safeSource && failedSource !== src ? src : '/avatar.svg'} alt={alt}
        referrerPolicy="no-referrer" decoding="async" onError={() => setFailedSource(src)} />;
};
export default Avatar;
