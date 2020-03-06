var padstate=0;
var gamepad=-1;
var gamepadbuttons=[]; // Button mapping
var gamepadaxes=[0, 0, 0, 0, 0]; // Axes mapping
var gamepadaxesval=[0, 0, 0, 0, 0]; // Axes values

// Clear gamepad input state
function clearinputstate()
{
  padstate=0;
}

// Check if an input is set o gamepad input state
function ispressed(keybit)
{
  return ((padstate&keybit)!=0);
}

// Scan for any connected gamepads
function gamepadscan()
{
  var gamepads=navigator.getGamepads();
  var found=0;

  var gleft=false;
  var gright=false;
  var gup=false;
  var gdown=false;
  var gjump=false;

  for (var padid=0; padid<gamepads.length; padid++)
  {
    // Only support first found gamepad
    if ((found==0) && (gamepads[padid] && gamepads[padid].connected))
    {
      found++;

      // If we don't already have this one, add mapping for it
      if (gamepad!=padid)
      {
        console.log("Found new gamepad "+padid+" '"+gamepads[padid].id+"'");

        gamepad=padid;

        if (gamepads[padid].mapping==="standard")
        {
          gamepadbuttons[0]=14; // left (left) d-left
          gamepadbuttons[1]=15; // right (left) d-right
          gamepadbuttons[2]=12; // top (left) d-up
          gamepadbuttons[3]=13; // bottom (left) d-down
          gamepadbuttons[4]=0;  // bottom button (right) x

          gamepadaxes[0]=0; // left/right axis
          gamepadaxes[1]=1; // up/down axis
          gamepadaxes[2]=2; // cam left/right axis
          gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="054c-0268-Sony PLAYSTATION(R)3 Controller")
        {
          // PS3
          gamepadbuttons[0]=15; // left (left) d-left
          gamepadbuttons[1]=16; // right (left) d-right
          gamepadbuttons[2]=13; // top (left) d-up
          gamepadbuttons[3]=14; // bottom (left) d-down
          gamepadbuttons[4]=0;  // bottom button (right) x

          gamepadaxes[0]=0; // left/right axis
          gamepadaxes[1]=1; // up/down axis
          gamepadaxes[2]=3; // cam left/right axis
          gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="045e-028e-Microsoft X-Box 360 pad")
        {
          // XBOX 360
          gamepadbuttons[0]=-1; // left (left) d-left
          gamepadbuttons[1]=-1; // right (left) d-right
          gamepadbuttons[2]=-1; // top (left) d-up
          gamepadbuttons[3]=-1; // bottom (left) d-down
          gamepadbuttons[4]=0;  // bottom button (right) x

          gamepadaxes[0]=6; // left/right axis
          gamepadaxes[1]=7; // up/down axis
          gamepadaxes[2]=3; // cam left/right axis
          gamepadaxes[3]=4; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="0f0d-00c1-  Switch Controller")
        {
          // Nintendo Switch
          gamepadbuttons[0]=-1; // left (left) d-left
          gamepadbuttons[1]=-1; // right (left) d-right
          gamepadbuttons[2]=-1; // top (left) d-up
          gamepadbuttons[3]=-1; // bottom (left) d-down
          gamepadbuttons[4]=1;  // bottom button (right) x

          gamepadaxes[0]=4; // left/right axis
          gamepadaxes[1]=5; // up/down axis
          gamepadaxes[2]=2; // cam left/right axis
          gamepadaxes[3]=3; // cam up/down axis
        }
        else
        if (gamepads[padid].id=="054c-05c4-Sony Computer Entertainment Wireless Controller")
        {
          // PS4
          gamepadbuttons[0]=-1; // left (left) d-left
          gamepadbuttons[1]=-1; // right (left) d-right
          gamepadbuttons[2]=-1; // top (left) d-up
          gamepadbuttons[3]=-1; // bottom (left) d-down
          gamepadbuttons[4]=0;  // bottom button (right) x

          gamepadaxes[0]=0; // left/right axis
          gamepadaxes[1]=1; // up/down axis
          gamepadaxes[2]=3; // cam left/right axis
          gamepadaxes[3]=4; // cam up/down axis
        }
        else
        {
          // Unknown non-"standard" mapping
          gamepadbuttons[0]=-1; // left (left) d-left
          gamepadbuttons[1]=-1; // right (left) d-right
          gamepadbuttons[2]=-1; // top (left) d-up
          gamepadbuttons[3]=-1; // bottom (left) d-down
          gamepadbuttons[4]=-1;  // bottom button (right) x

          gamepadaxes[0]=-1; // left/right axis
          gamepadaxes[1]=-1; // up/down axis
          gamepadaxes[2]=-1; // cam left/right axis
          gamepadaxes[3]=-1; // cam up/down axis
        }
      }

      // Check analog axes
      for (var i=0; i<gamepads[padid].axes.length; i++)
      {
        var val=gamepads[padid].axes[i];

        if (i==gamepadaxes[0])
        {
          gamepadaxesval[0]=val;

          if (val<-0.5) // Left
            gleft=true;

          if (val>0.5) // Right
            gright=true;
        }

        if (i==gamepadaxes[1])
        {
          gamepadaxesval[1]=val;

          if (val<-0.5) // Up
            gup=true;

          if (val>0.5) // Down
            gdown=true;
        }

        if (i==gamepadaxes[2])
          gamepadaxesval[2]=val;

        if (i==gamepadaxes[3])
          gamepadaxesval[3]=val;
      }

      // Check buttons
      for (i=0; i<gamepads[padid].buttons.length; i++)
      {
        var val=gamepads[padid].buttons[i];
        var pressed=val==1.0;

        if (typeof(val)=="object")
        {
          pressed=val.pressed;
          val=val.value;
        }

        if (pressed)
        {
          switch (i)
          {
            case gamepadbuttons[0]: gleft=true; break;
            case gamepadbuttons[1]: gright=true; break;
            case gamepadbuttons[2]: gup=true; break;
            case gamepadbuttons[3]: gdown=true; break;
            case gamepadbuttons[4]: gjump=true; break;
            default: break;
          }
        }
      }

      // Update padstate
      if (gup)
        padstate|=2;
      else
        padstate&=~2;

      if (gdown)
        padstate|=8;
      else
        padstate&=~8;

      if (gleft)
        padstate|=1;
      else
        padstate&=~1;

      if (gright)
        padstate|=4;
      else
        padstate&=~4;

      if (gjump)
        padstate|=16;
      else
        padstate&=~16;
    }
  }

  // Detect disconnect
  if ((found==0) && (gamepad!=-1))
  {
    console.log("Disconnected gamepad "+padid);

    gamepad=-1;
  }
}
