export function groupPermissionsByResource(
    permissions: string[],
): Record<string, string[]> {
    return permissions.reduce<Record<string, string[]>>((groups, name) => {
        const [resource] = name.split('.');

        (groups[resource] ??= []).push(name);

        return groups;
    }, {});
}
