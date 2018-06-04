const expect = require('chai').expect;
const sinon = require('sinon');
const dao = require('./utils/dao');
const store = require('../../src');

describe.only('Batching', () => {
    describe('Happy responses', () => {
        let testStore;
        let mockSource;
        afterEach(() => {
            testStore = null;
            mockSource.restore();
        });
        beforeEach(() => {
            mockSource = sinon.mock(dao);
            testStore = store({
                uniqueOptions: ['language'],
                getter: {
                    method: dao.getAssets
                }
            });
        });

        it('should batch single calls', () => {
            testStore.get('foo');
            return testStore.get('abc')
                .then((result) => {
                    expect(result).to.deep.equal({ id: 'abc', language: undefined });
                    mockSource.expects('getAssets')
                        .once()
                        .withArgs(['foo', 'abc']);
                });
        });

        it('should batch multi calls', () => {
            return testStore.get(['abc', 'foo'])
                .then((result) => {
                    expect(result).to.deep.equal([{ id: 'abc', language: undefined }, { id: 'foo', language: undefined }]);
                    mockSource.expects('getAssets')
                        .once()
                        .withArgs(['foo', 'abc']);
                });
        });

        it('should batch mixed calls', () => {
            testStore.get(['foo', 'bar']);
            return testStore.get('abc')
                .then((result) => {
                    expect(result).to.deep.equal({ id: 'abc', language: undefined });
                    mockSource.expects('getAssets')
                        .once()
                        .withArgs(['foo', 'bar', 'abc']);
                });
        });

        it('should mix unique params matches', () => {
            testStore.get(['foo', 'bar'], { language: 'fr' });
            return testStore.get('abc', { language: 'fr' })
                .then((result) => {
                    expect(result).to.deep.equal({ id: 'abc' , language: 'fr' });
                    mockSource.expects('getAssets')
                        .once().withArgs(['foo', 'bar', 'abc'], { language: 'fr' });
                });
        });

        it('should not mix unique params mismatches', () => {
            testStore.get(['foo', 'bar'], { language: 'fr' });
            return testStore.get('abc', { language: 'en' })
                .then((result) => {
                    expect(result).to.deep.equal({ id: 'abc', language: 'en' });
                    mockSource.expects('getAssets')
                        .once().withArgs(['abc'], { language: 'en' })
                        .once().withArgs(['foo', 'bar'], { language: 'fr' });
                });
        });

        it('should support disabled batching', () => {
            testStore.config.batch = false;
            testStore.get('foo');
            return testStore.get('abc')
                .then((result) => {
                    expect(result).to.deep.equal({ id: 'abc', language: undefined });
                    mockSource.expects('getAssets')
                        .once()
                        .withArgs(['abc']);
                });
        });
    });

    describe('Empty responses', () => {
        let testStore;
        let mockSource;
        afterEach(() => {
            testStore = null;
            mockSource.restore();
        });
        beforeEach(() => {
            mockSource = sinon.mock(dao);
            testStore = store({
                uniqueOptions: ['language'],
                getter: {
                    method: dao.getEmptyGroup
                }
            });
        });

        it('should batch single calls', () => {
            testStore.get('foo');
            return testStore.get('abc')
                .then((result) => {
                    expect(result).to.be.undefined;
                    mockSource.expects('getEmptyGroup')
                        .once()
                        .withArgs(['foo', 'abc']);
                });
        });

        it('should batch multi calls', () => {
            return testStore.get(['abc', 'foo'])
                .then((result) => {
                    expect(result).to.deep.equal([undefined, undefined]);
                    mockSource.expects('getEmptyGroup')
                        .once()
                        .withArgs(['foo', 'abc']);
                });
        });

        it('should batch mixed calls', () => {
            testStore.get(['foo', 'bar']);
            return testStore.get('abc')
                .then((result) => {
                    expect(result).to.be.undefined;
                    mockSource.expects('getEmptyGroup')
                        .once()
                        .withArgs(['foo', 'bar', 'abc']);
                });
        });

        it('should mix unique params matches', () => {
            testStore.get(['foo', 'bar'], { language: 'fr' });
            return testStore.get('abc', { language: 'fr' })
                .then((result) => {
                    expect(result).to.be.undefined;
                    mockSource.expects('getEmptyGroup')
                        .once().withArgs(['foo', 'bar', 'abc'], { language: 'fr' });
                });
        });

        it('should not mix unique params mismatches', () => {
            testStore.get(['foo', 'bar'], { language: 'fr' });
            return testStore.get('abc', { language: 'en' })
                .then((result) => {
                    expect(result).to.be.undefined;
                    mockSource.expects('getEmptyGroup')
                        .once().withArgs(['abc'], { language: 'en' })
                        .once().withArgs(['foo', 'bar'], { language: 'fr' });
                });
        });

        it('should support disabled batching', () => {
            testStore.config.batch = false;
            testStore.get('foo');
            return testStore.get('abc')
                .then((result) => {
                    expect(result).to.be.undefined;
                    mockSource.expects('getEmptyGroup')
                        .once()
                        .withArgs(['abc']);
                });
        });
    });

    describe('Partial responses', () => {
        let testStore;
        let mockSource;
        afterEach(() => {
            testStore = null;
            mockSource.restore();
        });
        beforeEach(() => {
            mockSource = sinon.mock(dao);
            testStore = store({
                uniqueOptions: ['language'],
                getter: {
                    method: dao.getPartialGroup
                }
            });
        });

        it('should return the valid results mixed calls', () => {
            return testStore.get(['abc', 'foo', 'bar'])
                .then((result) => {
                    expect(result).to.deep.equal([{ id: 'abc', language: undefined }, undefined, undefined]);
                    mockSource.expects('getPartialGroup')
                        .once()
                        .withArgs(['foo', 'bar', 'abc']);
                });
        });
    });

    describe('Rejected requests', () => {
        let testStore;
        let mockSource;
        afterEach(() => {
            testStore = null;
            mockSource.restore();
        });
        beforeEach(() => {
            mockSource = sinon.mock(dao);
            testStore = store({
                uniqueOptions: ['language'],
                getter: {
                    method: dao.getFailedRequest
                }
            });
        });

        it('should properly reject on single request', () => {
            return testStore.get('abc', { language: 'fr' })
                .then(null, (error) => {
                    expect(error).to.deep.equal({ error: 'Something went wrong' });
                    mockSource.expects('getFailedRequest')
                        .once().withArgs(['abc'], { language: 'fr' });
                });
        });

        it('should properly reject on multi request', () => {
            return testStore.get(['abc', 'foo'], { language: 'en' })
                .then(null, (error) => {
                    expect(error).to.deep.equal({ error: 'Something went wrong' });
                    mockSource.expects('getFailedRequest')
                        .once().withArgs(['abc', 'foo'], { language: 'en' });
                });
        });

        it('should properly reject with disabled batching', () => {
            testStore.config.batch = false;
            return testStore.get('abc')
                .then(null, (error) => {
                    expect(error).to.deep.equal({ error: 'Something went wrong' });
                    mockSource.expects('getFailedRequest')
                        .once()
                        .withArgs(['abc']);
                });
        });
    });

    describe('Failed requests', () => {
        let testStore;
        let mockSource;
        afterEach(() => {
            testStore = null;
            mockSource.restore();
        });
        beforeEach(() => {
            mockSource = sinon.mock(dao);
            testStore = store({
                uniqueOptions: ['language'],
                getter: {
                    method: dao.getErroredRequest
                }
            });
        });

        it('should properly reject on single request', () => {
            return testStore.get('abc', { language: 'fr' })
                .then(null, (error) => {
                    expect(error).to.deep.equal({ error: 'Something went wrong' });
                    mockSource.expects('getErroredRequest')
                        .once().withArgs(['abc'], { language: 'fr' });
                });
        });

        it('should properly reject on multi request', () => {
            return testStore.get(['abc', 'foo'], { language: 'en' })
                .then(null, (error) => {
                    expect(error).to.deep.equal({ error: 'Something went wrong' });
                    mockSource.expects('getErroredRequest')
                        .once().withArgs(['abc', 'foo'], { language: 'en' });
                });
        });

        it('should properly reject with disabled batching', () => {
            testStore.config.batch = false;
            return testStore.get('abc')
                .then(null, (error) => {
                    expect(error).to.deep.equal({ error: 'Something went wrong' });
                    mockSource.expects('getErroredRequest')
                        .once()
                        .withArgs(['abc']);
                });
        });
    });
});