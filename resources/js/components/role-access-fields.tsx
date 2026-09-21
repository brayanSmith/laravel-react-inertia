import PermissionsFieldset from '@/components/permissions-fieldset';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RoleBodegaOption } from '@/types';

type Props = {
    permissions: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    bodegas: RoleBodegaOption[];
    selectedBodegas: number[];
    onBodegasChange: (selected: number[]) => void;
};

const isDashboard = (permission: string) => permission.startsWith('dashboard.');

/**
 * What a role grants, in tabs: module permissions, the bodegas it can use
 * and the dashboard widgets and charts it can see. Also renders the hidden
 * inputs the role form submits.
 */
export default function RoleAccessFields({
    permissions,
    selected,
    onChange,
    bodegas,
    selectedBodegas,
    onBodegasChange,
}: Props) {
    const modulePermissions = permissions.filter((name) => !isDashboard(name));
    const dashboardPermissions = permissions.filter(isDashboard);

    const changeGroup = (group: string[]) => (next: string[]) =>
        onChange([
            ...selected.filter((name) => !group.includes(name)),
            ...next,
        ]);

    const toggleBodega = (id: number, checked: boolean) => {
        onBodegasChange(
            checked
                ? [...selectedBodegas, id]
                : selectedBodegas.filter((bodegaId) => bodegaId !== id),
        );
    };

    return (
        <>
            <Tabs defaultValue="permisos">
                <TabsList>
                    <TabsTrigger value="permisos">Permisos</TabsTrigger>
                    <TabsTrigger value="bodegas" data-test="role-tab-bodegas">
                        Bodegas autorizadas
                    </TabsTrigger>
                    <TabsTrigger
                        value="dashboard"
                        data-test="role-tab-dashboard"
                    >
                        Panel (widgets y gráficos)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="permisos" className="pt-3">
                    <PermissionsFieldset
                        permissions={modulePermissions}
                        selected={selected.filter((name) => !isDashboard(name))}
                        onChange={changeGroup(modulePermissions)}
                    />
                </TabsContent>

                <TabsContent value="bodegas" className="space-y-3 pt-3">
                    <p className="text-muted-foreground text-sm">
                        Las bodegas marcadas son las únicas que este rol podrá
                        elegir en los selectores de la aplicación. Si no marcas
                        ninguna, el rol puede usar todas las bodegas.
                    </p>
                    <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                        {bodegas.map((bodega) => (
                            <div
                                key={bodega.id}
                                className="flex items-center gap-3 rounded-lg border p-3"
                            >
                                <Checkbox
                                    id={`role-bodega-${bodega.id}`}
                                    checked={selectedBodegas.includes(
                                        bodega.id,
                                    )}
                                    onCheckedChange={(checked) =>
                                        toggleBodega(
                                            bodega.id,
                                            checked === true,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor={`role-bodega-${bodega.id}`}
                                    className="cursor-pointer"
                                >
                                    {bodega.nombre_bodega}
                                </Label>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="dashboard" className="pt-3">
                    <PermissionsFieldset
                        permissions={dashboardPermissions}
                        selected={selected.filter(isDashboard)}
                        onChange={changeGroup(dashboardPermissions)}
                    />
                </TabsContent>
            </Tabs>

            {selected.map((permission) => (
                <input
                    key={permission}
                    type="hidden"
                    name="permissions[]"
                    value={permission}
                />
            ))}
            {selectedBodegas.map((id) => (
                <input key={id} type="hidden" name="bodegas[]" value={id} />
            ))}
        </>
    );
}
