/**
 * Package index
 */

import 'mocha';
import { expect, } from 'chai';

import * as pkg from '../src';

describe('[PuzzleIO][StateManager]', () => {

	it('Module integrity check', () => {

		expect(pkg).to.be.an('object');

		expect(Object.keys(pkg)).to.be.an('array').that.has.lengthOf(1);
		expect(pkg).to.have.property('storage').which.is.an('object');
	});
});
