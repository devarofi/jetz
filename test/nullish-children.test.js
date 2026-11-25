import { describe, it, expect } from 'vitest';
import { Jetz } from '../src/lib/jetz.js';
import { css, div, span, p } from '../src/lib/jetz-ui.js';

const mount = (element) => {
	const target = document.createElement('div');
	document.body.append(target);
	Jetz.mount(element, target);
	return target;
};

describe('nullish children', () => {
	it('skips null/undefined/boolean children instead of crashing', () => {
		const target = mount(div(
			p(css`font-bold`, 'sebelum'),
			true ? span('ada') : null,
			false ? span('tak dirender') : undefined,
			true ? span('tetap') : false,
			p('sesudah')
		));
		expect(target.textContent).toContain('sebelum');
		expect(target.textContent).toContain('sesudah');
		expect(target.textContent).not.toContain('undefined');
		expect(target.textContent).not.toContain('tak dirender');
		expect(target.querySelectorAll('span').length).toBe(2);
	});

	it('keeps sibling order stable when a null child precedes elements', () => {
		const target = mount(div(null, span(css`font-bold`, 'teks'), p('pembuka')));
		expect(target.textContent).toBe('tekspembuka');
	});

	it('append(null) directly is a no-op', () => {
		const target = mount(div('isi'));
		expect(() => div().append(null)).not.toThrow();
		expect(target.textContent).toBe('isi');
	});
});
