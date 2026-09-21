import { Search } from 'lucide-react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    groupPermissionsByResource,
    permissionHint,
    permissionLabel,
    resourceLabel,
} from '@/lib/permissions';

const normalize = (text: string) =>
    text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

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
    const [search, setSearch] = useState('');
    const groups = groupPermissionsByResource(permissions);
    const term = normalize(search.trim());

    // The search is by page (module): only the modules whose name matches.
    const visibleGroups = Object.entries(groups).filter(
        ([resource]) =>
            term === '' || normalize(resourceLabel(resource)).includes(term),
    );

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

            <div className="relative">
                <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar página..."
                    className="pl-9"
                    data-test="permissions-search"
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                        }
                    }}
                />
            </div>

            <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
                {visibleGroups.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                        No hay páginas que coincidan.
                    </p>
                ) : null}
                {visibleGroups.map(([resource, resourcePermissions]) => {
                    const groupAllSelected = resourcePermissions.every(
                        (permission) => selected.includes(permission),
                    );

                    return (
                        <div
                            key={resource}
                            className="space-y-2 rounded-lg border p-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {resourceLabel(resource)}
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
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {resourcePermissions.map((permission) => (
                                    <label
                                        key={permission}
                                        className="flex items-center gap-2 text-sm"
                                        title={
                                            permissionHint(permission) ??
                                            permission
                                        }
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
                                        {permissionLabel(permission)}
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
