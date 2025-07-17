import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { updateTailwindGlobsGenerator } from './update-tailwind-globs';
import { UpdateTailwindGlobsGeneratorSchema } from './schema';

describe('update-tailwind-globs generator', () => {
    let tree: Tree;
    const options: UpdateTailwindGlobsGeneratorSchema = { name: 'test' };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should run successfully', async () => {
        await updateTailwindGlobsGenerator(tree, options);
        const config = readProjectConfiguration(tree, 'test');
        expect(config).toBeDefined();
    });
});
