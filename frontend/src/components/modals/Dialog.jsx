import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Dialog = ({ onClose, labelledBy, children }) => {
    const ref = useRef(null);
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);

    useEffect(() => {
        const previous = document.activeElement;
        const app = document.getElementById('root');
        const wasInert = app.inert;
        app.inert = true;
        const focusable = () => [...ref.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(element => element.getClientRects().length > 0);
        (focusable()[0] || ref.current).focus();
        const onKey = event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeRef.current();
            }
            if (event.key === 'Tab') {
                const items = focusable();
                const first = items[0], last = items.at(-1);
                if (!first) { event.preventDefault(); ref.current.focus(); }
                else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            app.inert = wasInert;
            if (previous?.isConnected) previous.focus();
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(3,5,10,.76)', backdropFilter: 'blur(6px)' }}
            onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
            <section ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}
                className="surface-glass rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto scroll-slim animate-pop">
                {children}
            </section>
        </div>, document.body
    );
};
export default Dialog;
