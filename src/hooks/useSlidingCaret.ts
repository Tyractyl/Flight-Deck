import { useEffect, useRef } from 'react';

/*
 * Sliding caret for the auth inputs.
 *
 * The native text caret jumps instantly between characters. This hook hides
 * the native caret (caret-color: transparent) and draws a small bar that
 * glides — via a CSS transform transition — to the text insertion point
 * after typing, arrow keys, or clicking inside the text.
 *
 * Attach the returned ref to the input's positioned wrapper; the caret is
 * rendered inside it in the wrapper's coordinate space.
 */
export function useSlidingCaret<T extends HTMLElement>() {
  const wrapperRef = useRef<T | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const input = wrapper.querySelector('input');
    if (!input) return;

    const styleId = 'sliding-caret-keyframes';
    if (!document.getElementById(styleId)) {
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent =
        '@keyframes sliding-caret-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }';
      document.head.appendChild(styleTag);
    }

    const caret = document.createElement('div');
    Object.assign(caret.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '1px',
      background: 'var(--fg)',
      pointerEvents: 'none',
      opacity: '0',
      zIndex: '5',
      transition: 'transform 0.09s cubic-bezier(0.16, 1, 0.3, 1)',
      willChange: 'transform',
    });
    wrapper.appendChild(caret);

    input.style.caretColor = 'transparent';

    // Size the bar to the input's font and center it vertically, so the hook
    // works on inputs of any height. The auth page renders in design pixels
    // scaled up with transform:scale — divide by the live scale so the bar is
    // exactly one CSS pixel thick — the same as a native caret.
    const setGeometry = () => {
      const scale = wrapper.offsetWidth
        ? wrapper.getBoundingClientRect().width / wrapper.offsetWidth
        : 1;
      const cssPx = Math.min(Math.max(1 / (scale || 1), 0.2), 1);
      caret.style.width = `${cssPx.toFixed(3)}px`;
      const fontSize = parseFloat(getComputedStyle(input).fontSize) || 14;
      const height = Math.max(4, Math.round(fontSize * 1.15));
      caret.style.height = `${height}px`;
      // The caret lives in the wrapper's coordinate space, and the input may
      // sit offset inside it (the auth inputs are absolutely positioned), so
      // center on the input's own box rather than the wrapper's.
      const top = input.offsetTop + Math.max(0, Math.round((input.clientHeight - height) / 2));
      caret.style.top = `${top}px`;
    };
    setGeometry();
    window.addEventListener('resize', setGeometry);

    const measureCtx = document.createElement('canvas').getContext('2d');

    const place = () => {
      if (!measureCtx) return;
      let index = input.value.length;
      try {
        index = input.selectionStart ?? input.value.length;
      } catch {
        /* some input types (email) don't expose the selection */
      }
      const cs = getComputedStyle(input);
      measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const text =
        input.type === 'password'
          ? '\u2022'.repeat(input.value.length)
          : input.value.slice(0, index);
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      const contentWidth = input.clientWidth - padLeft - padRight;
      const x = padLeft + measureCtx.measureText(text).width - input.scrollLeft;
      const clamped = Math.min(Math.max(x, padLeft), padLeft + Math.max(contentWidth - 1, 0));
      caret.style.transform = `translateX(${clamped}px)`;
    };

    const restartBlink = () => {
      caret.style.animation = 'none';
      void caret.offsetWidth; // flush so the blink restarts from solid
      caret.style.animation = 'sliding-caret-blink 1.06s linear 0.4s infinite';
    };

    let placedOnce = false;

    const show = () => {
      caret.style.opacity = '1';
      if (!placedOnce) {
        // First reveal: position without the transform transition, so the
        // caret doesn't glide in from the wrapper's left edge.
        placedOnce = true;
        caret.style.transition = 'none';
        place();
        void caret.offsetWidth;
        caret.style.transition = '';
      } else {
        place();
      }
      restartBlink();
    };
    const hide = () => {
      caret.style.opacity = '0';
      caret.style.animation = 'none';
    };
    const onMove = () => {
      if (document.activeElement === input) place();
    };
    const onInput = () => {
      place();
      restartBlink();
    };

    input.addEventListener('input', onInput);
    input.addEventListener('click', onMove);
    input.addEventListener('keyup', onMove);
    input.addEventListener('focus', show);
    input.addEventListener('blur', hide);
    document.addEventListener('selectionchange', onMove);

    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) onMove();
    });

    return () => {
      cancelled = true;
      window.removeEventListener('resize', setGeometry);
      input.removeEventListener('input', onInput);
      input.removeEventListener('click', onMove);
      input.removeEventListener('keyup', onMove);
      input.removeEventListener('focus', show);
      input.removeEventListener('blur', hide);
      document.removeEventListener('selectionchange', onMove);
      input.style.caretColor = '';
      caret.remove();
    };
  }, []);

  return wrapperRef;
}
