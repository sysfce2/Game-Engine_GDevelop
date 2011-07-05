#include <vector>
#include <string>
#include <iostream>
#include <cmath>
#include <sstream>
#include "GDL/Object.h"
#include "GDL/Event.h"
#include "GDL/Chercher.h"
#include "GDL/CommonTools.h"
#include "GDL/RuntimeScene.h"
#include "GDL/ObjectsConcerned.h"

/**
 * Show a layer
 */
bool ActShowLayer( RuntimeScene & scene, ObjectsConcerned & objectsConcerned, const Instruction & action )
{
    string layer = action.GetParameter(0).GetAsTextExpressionResult(scene, objectsConcerned);

    scene.GetLayer(layer).SetVisibility(true);

    return true;
}

/**
 * Hide a layer
 */
bool ActHideLayer( RuntimeScene & scene, ObjectsConcerned & objectsConcerned, const Instruction & action )
{
    string layer = action.GetParameter(0).GetAsTextExpressionResult(scene, objectsConcerned);

    scene.GetLayer(layer).SetVisibility(false);

    return true;
}
