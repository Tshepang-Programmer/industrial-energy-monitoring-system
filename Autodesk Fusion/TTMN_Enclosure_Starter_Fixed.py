# Fusion 360 Python script: TTMN enclosure starter (single-component version)
# Creates a hollow base body and a separate lid body in the active Part Design document.
# The lid is positioned above the base for visibility. Inspect/refine before fabrication.
import adsk.core, adsk.fusion, traceback

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox('Open a Fusion 360 design first.')
            return
        root = design.rootComponent

        # Fusion API internal length units are centimetres.
        L, W, base_h = 18.0, 13.0, 5.7  # 180 x 130 x 57 mm base
        wall, floor = 0.25, 0.25        # 2.5 mm wall and floor
        lid_h = 0.8                      # 8 mm lid; nominal combined height 65 mm

        def rect_sketch(comp, name, x0, y0, dx, dy, plane=None):
            sk = comp.sketches.add(plane or comp.xYConstructionPlane)
            sk.name = name
            sk.sketchCurves.sketchLines.addTwoPointRectangle(
                adsk.core.Point3D.create(x0, y0, 0),
                adsk.core.Point3D.create(x0 + dx, y0 + dy, 0))
            return sk

        def extrude_body(comp, profile, name, height, operation):
            inp = comp.features.extrudeFeatures.createInput(profile, operation)
            inp.setDistanceExtent(False, adsk.core.ValueInput.createByReal(height))
            ext = comp.features.extrudeFeatures.add(inp)
            if ext.bodies.count:
                ext.bodies.item(0).name = name
            return ext

        # Create base outer solid in root component.
        outer_sk = rect_sketch(root, 'TTMN base outer footprint', 0, 0, L, W)
        outer_prof = outer_sk.profiles.item(0)
        extrude_body(root, outer_prof, 'TTMN Enclosure Base', base_h,
                     adsk.fusion.FeatureOperations.NewBodyFeatureOperation)

        # Hollow the base from a sketch offset above the bottom floor.
        plane_input = root.constructionPlanes.createInput()
        plane_input.setByOffset(root.xYConstructionPlane, adsk.core.ValueInput.createByReal(floor))
        cavity_plane = root.constructionPlanes.add(plane_input)
        cavity_sk = rect_sketch(root, 'TTMN base cavity profile', wall, wall,
                                L - 2*wall, W - 2*wall, cavity_plane)
        cavity_prof = cavity_sk.profiles.item(0)
        cut = root.features.extrudeFeatures.createInput(
            cavity_prof, adsk.fusion.FeatureOperations.CutFeatureOperation)
        cut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(base_h - floor + 0.02))
        root.features.extrudeFeatures.add(cut)

        # Add lid as another body in the same component, avoiding assembly-only components.
        lid_sk = rect_sketch(root, 'TTMN removable lid footprint', 0, 0, L, W)
        lid_prof = lid_sk.profiles.item(0)
        lid_ext = root.features.extrudeFeatures.createInput(
            lid_prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
        lid_ext.setDistanceExtent(False, adsk.core.ValueInput.createByReal(lid_h))
        lid_feature = root.features.extrudeFeatures.add(lid_ext)
        lid_body = lid_feature.bodies.item(0)
        lid_body.name = 'TTMN Removable Lid'
        # Move lid to z = base_h + 0.3 cm (3 mm gap above base).
        objs = adsk.core.ObjectCollection.create()
        objs.add(lid_body)
        matrix = adsk.core.Matrix3D.create()
        matrix.translation = adsk.core.Vector3D.create(0, 0, base_h + 0.3)
        root.features.moveFeatures.add(root.features.moveFeatures.createInput(objs, matrix))

        ui.messageBox('TTMN starter geometry created in the active design. The base and lid are separate bodies in one component; the lid is raised above the base. Next we will refine the lid fit, mounting posts, and connector openings. Inspect before fabrication.')
    except:
        if ui:
            ui.messageBox('Error creating TTMN enclosure:\n' + traceback.format_exc())
