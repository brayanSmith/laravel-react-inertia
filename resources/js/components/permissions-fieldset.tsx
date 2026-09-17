import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { groupPermissionsByResource } from '@/lib/permissions';

type Props = {
    permissions: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
};

export default function PermissionsFieldset({
    permissions,
    selected,
    onChange,
}: Props) {
    const groups = groupPermissionsByResource(permissions);
    const allSelected =
        permissions.length > 0 && selected.length === permissions.length;
    const someSelected = selected.length > 0 && !allSelected;

    const toggleAll = (checked: boolean) => {
        onChange(checked ? [...permissions] : []);
    };

    const toggleGroup = (groupPermissions: string[], checked: boolean) => {
        onChange(
            checked
                ? [...new Set([...selected, ...groupPermissions])]
                : selected.filter((name) => !groupPermissions.includes(name)),
        );
    };

    const togglePermission = (permission: string, checked: boolean) => {
        onChange(
            checked
                ? [...selected, permission]
                : selected.filter((name) => name !== permission),
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-3">
                <Checkbox
                    id="permissions-select-all"
                    checked={
                        allSelected
                            ? true
                            : someSelected
                              ? 'indeterminate'
                              : false
                    }
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                />
                <div className="grid gap-1 leading-none">
                    <Label
                        htmlFor="permissions-select-all"
                        className="cursor-pointer"
                    >
                        Seleccionar todos
                    </Label>
                    <p className="text-muted-foreground text-xs">
                        Habilita todos los permisos disponibles para este rol.
                    </p>
                </div>
            </div>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                {Object.entries(groups).map(
                    ([resource, resourcePermissions]) => {
                        const groupAllSelected = resourcePermissions.every(
                            (permission) => selected.includes(permission),
                        );

                        return (
                            <div
                                key={resource}
                                className="space-y-2 rounded-lg border p-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium capitalize">
                                        {resource}
                                    </span>
                                    <button
                                        type="button"
                                        className="text-primary text-xs hover:underline"
                                        onClick={() =>
                                            toggleGroup(
                                                resourcePermissions,
                                                !groupAllSelected,
                                            )
                                        }
                                    >
                                        {groupAllSelected
                                            ? 'Deseleccionar todos'
                                            : 'Seleccionar todos'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {resourcePermissions.map((permission) => (
                                        <label
                                            key={permission}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selected.includes(
                                                    permission,
                                                )}
                                                onCheckedChange={(checked) =>
                                                    togglePermission(
                                                        permission,
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            {permission}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}
