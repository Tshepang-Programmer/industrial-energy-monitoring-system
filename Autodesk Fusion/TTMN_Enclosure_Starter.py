# Fusion 360 Python script: TTMN enclosure starter
# Creates a simple hollow base and separate lid. Inspect and refine before fabrication.
import adsk.core, adsk.fusion, traceback

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox('Open a Fusion design first.')
            return
        root = design.rootComponent

        # Fusion API length values are centimetres: 180 x 130 x 57 mm base,
        # plus a separate 8 mm lid for a nominal 65 mm overall height.
        L, W, base_h = 18.0, 13.0, 5.7
        wall, floor = 0.25, 0.25
        lid_h = 0.8

        def rectangle_body(comp, name, x0, y0, z0, dx, dy, dz):
            sk = comp.sketches.add(comp.xYConstructionPlane)
            sk.name = name + ' sketch'
            sk.sketchCurves.sketchLines.addTwoPointRectangle(
                adsk.core.Point3D.create(x0, y0, 0),
                adsk.core.Point3D.create(x0 + dx, y0 + dy, 0))
            prof = sk.profiles.item(0)
            inp = comp.features.extrudeFeatures.createInput(
                prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
            inp.setDistanceExtent(False, adsk.core.ValueInput.createByReal(dz))
            body = comp.features.extrudeFeatures.add(inp).bodies.item(0)
            body.name = name
            if z0:
                objs = adsk.core.ObjectCollection.create()
                objs.add(body)
                mat = adsk.core.Matrix3D.create()
                mat.translation = adsk.core.Vector3D.create(0, 0, z0)
                comp.features.moveFeatures.add(comp.features.moveFeatures.createInput(objs, mat))
            return body

        base_occ = root.occurrences.addNewComponent(adsk.core.Matrix3D.create())
        base = base_occ.component
        base.name = 'TTMN Enclosure Base'
        rectangle_body(base, 'Base outer body', 0, 0, 0, L, W, base_h)

        plane_input = base.constructionPlanes.createInput()
        plane_input.setByOffset(base.xYConstructionPlane, adsk.core.ValueInput.createByReal(floor))
        cavity_plane = base.constructionPlanes.add(plane_input)
        cavity_sk = base.sketches.add(cavity_plane)
        cavity_sk.name = 'Cavity profile'
        cavity_sk.sketchCurves.sketchLines.addTwoPointRectangle(
            adsk.core.Point3D.create(wall, wall, 0),
            adsk.core.Point3D.create(L-wall, W-wall, 0))
        cavity_prof = cavity_sk.profiles.item(0)
        cut = base.features.extrudeFeatures.createInput(
            cavity_prof, adsk.fusion.FeatureOperations.CutFeatureOperation)
        cut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(base_h-floor+0.02))
        base.features.extrudeFeatures.add(cut)

        lid_occ = root.occurrences.addNewComponent(adsk.core.Matrix3D.create())
        lid_comp = lid_occ.component
        lid_comp.name = 'TTMN Removable Lid'
        rectangle_body(lid_comp, 'Lid', 0, 0, base_h + 0.3, L, W, lid_h)

        ui.messageBox('TTMN starter model created: 180 x 130 mm footprint, nominal 65 mm total height. The lid is separate and lifted slightly for visibility. Next we will add mounting posts and connector openings. Inspect before fabrication.')
    except:
        if ui:
            ui.messageBox('Error creating TTMN enclosure:\n' + traceback.format_exc())
